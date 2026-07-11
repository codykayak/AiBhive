/**
 * Fable Scrape — AI-directed harvest orchestrator.
 *
 * Chains, in this fixed order:
 *   1. DIRECTOR (default Grok) reads the user's plain-English instruction plus
 *      the discovered candidates and intelligently SELECTS which items to pull.
 *   2. VISION/OCR (default Gemini 2.5) reads the actual selected images.
 *   3. TRANSLATOR (default Gemini 2.5) translates the OCR'd findings.
 *
 * For text-heavy archives (newspapers, Chronicling America, catalogs) where few
 * images are discoverable, falls back to a TEXT-CORPUS harvest: Director reads
 * crawled page text and returns cited leads without Vision OCR.
 */
import { scanPage, crawlSite, downloadAsset } from './fableScrape.js';
import { runChat, runVision, extractJson, PROVIDERS } from './fableScrapeProviders.js';
import { MAX_HARVEST_FINDINGS, MAX_TRANSLATE_CHARS } from './costProtection.js';
import { getTartarianStarterBrief, shouldInjectTartarianFinds } from './tartarianFindsDirectory.js';
import { resolveStartUrlFromQuery, resolveArchiveStartUrl, scorePrimarySourceImage } from './drocScout.js';

const DEFAULT_ROLES = {
  director: { provider: 'grok', model: '' },
  vision: { provider: 'gemini', model: '' },
  translator: { provider: 'gemini', model: '' },
};

function mergeRoles(roles = {}) {
  return {
    director: { ...DEFAULT_ROLES.director, ...(roles.director || {}) },
    vision: { ...DEFAULT_ROLES.vision, ...(roles.vision || {}) },
    translator: { ...DEFAULT_ROLES.translator, ...(roles.translator || {}) },
  };
}

/** Prefer full CDLI scans over tiny search-result thumbs when OCR'ing. */
function preferFullResolutionScan(url = '') {
  return String(url).replace(/\/dl\/tn_photo\//i, '/dl/photo/');
}

const TRANSLATE_SYSTEM =
  'You are an expert archival translator. Translate the supplied document text into the requested language. ' +
  'Preserve names, dates, and place names exactly. If the source language or script is uncertain, add a short ' +
  'bracketed note. Return only the translation.';

const OCR_PROMPT =
  'You are an expert palaeographer and OCR system. Transcribe ALL text visible in this image exactly as it appears, ' +
  'preserving line breaks and layout. If the script is ancient or non-Latin (e.g. cuneiform, hieroglyphic, ' +
  'medieval hand), transliterate what you can and describe any untranscribable marks. Do not invent content.';

const TEXT_DIRECTOR_SYSTEM =
  'You are the director of a primary-source research harvest over crawled archive/newspaper text. ' +
  'Respond with strict JSON only. Never invent sources — only cite URLs and quotes present in the corpus. ' +
  'Prefer under-discussed, specific, citable leads over vague summaries.';

function buildCorpusFromDiscovery(discovery, startUrl) {
  const chunks = [];
  if (discovery.text && String(discovery.text).trim().length > 80) {
    chunks.push({
      url: discovery.finalUrl || discovery.startUrl || startUrl,
      title: discovery.title || 'Start page',
      text: String(discovery.text).slice(0, 24000),
    });
  }
  for (const p of discovery.pages || []) {
    if (!p?.text || String(p.text).trim().length < 80) continue;
    // Avoid duplicating the start page text already added
    if (chunks.some((c) => c.url === p.url)) continue;
    chunks.push({
      url: p.url,
      title: p.title || p.url,
      text: String(p.text).slice(0, 12000),
    });
  }
  return chunks.slice(0, 12);
}

function formatCorpusForPrompt(chunks) {
  return chunks
    .map(
      (c, i) =>
        `--- CORPUS ${i} ---\nTitle: ${c.title}\nURL: ${c.url}\nExcerpt:\n${c.text.slice(0, 6000)}`,
    )
    .join('\n\n')
    .slice(0, 48000);
}

/**
 * Text-corpus path for newspaper / catalog archives with little image HTML.
 */
async function harvestFromTextCorpus({
  prompt,
  discovery,
  roles,
  keys,
  wanted,
  url,
  warnings,
  onProgress,
}) {
  const chunks = buildCorpusFromDiscovery(discovery, url);
  const corpusChars = chunks.reduce((n, c) => n + c.text.length, 0);
  if (!chunks.length || corpusChars < 400) {
    return null;
  }

  onProgress({
    stage: 'director',
    message: `${PROVIDERS[roles.director.provider]?.label || roles.director.provider} is mining page text for leads…`,
  });

  const directorPrompt =
    `Researcher request:\n"""${prompt.trim()}"""\n\n` +
    `You are given crawled text from a primary-source archive (often newspapers or catalogs).\n` +
    `Extract up to ${wanted} strong, specific leads worth deeper investigation.\n` +
    `Rules:\n` +
    `- Only use evidence present in the corpus below.\n` +
    `- Each lead must include a short verbatim quote and the source URL from the corpus.\n` +
    `- Prefer obscure / under-discussed items with clear place/date hooks.\n` +
    `- For CDLI / museum catalogs: artifact IDs (P######), designations, periods, and /artifacts/N URLs count as citable leads even without a long quote.\n` +
    `- If the corpus is mostly navigation chrome with no usable content, return selections:[].\n` +
    `- Return ONLY JSON:\n` +
    `{"strategy":"one sentence","mode":"text-corpus","selections":[{"title":"...","reason":"why promising","quote":"verbatim excerpt","sourceUrl":"https://...","confidence":0-1}]}\n\n` +
    (shouldInjectTartarianFinds(prompt)
      ? `${getTartarianStarterBrief({ maxChars: 1800 })}\n\nUse directory angles only as prioritization hints — still cite only corpus evidence.\n\n`
      : '') +
    formatCorpusForPrompt(chunks);

  let strategy = '';
  let selections = [];
  try {
    const raw = await runChat({
      provider: roles.director.provider,
      model: roles.director.model,
      byok: keys,
      system: TEXT_DIRECTOR_SYSTEM,
      prompt: directorPrompt,
      json: true,
      maxTokens: 2500,
    });
    const parsed = extractJson(raw) || {};
    strategy = String(parsed.strategy || '').slice(0, 400);
    selections = Array.isArray(parsed.selections) ? parsed.selections : [];
  } catch (err) {
    throw new Error(`Director text harvest failed: ${err instanceof Error ? err.message : 'AI error'}`);
  }

  const allowedUrls = new Set(chunks.map((c) => c.url));
  const findings = selections
    .slice(0, wanted)
    .map((s, i) => {
      const sourceUrl = String(s.sourceUrl || '').trim();
      const quote = String(s.quote || '').trim();
      const title = String(s.title || `Lead ${i + 1}`).slice(0, 200);
      const reason = String(s.reason || '').slice(0, 400);
      // Prefer corpus URL if model invented one
      const safeUrl = allowedUrls.has(sourceUrl)
        ? sourceUrl
        : chunks.find((c) => sourceUrl && c.url.includes(sourceUrl))?.url ||
          chunks[0]?.url ||
          discovery.finalUrl ||
          url;
      return {
        url: safeUrl,
        filename: title,
        alt: reason,
        sourceUrl: safeUrl,
        reason,
        confidence: typeof s.confidence === 'number' ? s.confidence : null,
        ocrText: quote || reason,
        translation: reason
          ? `Research lead: ${title}\n\nWhy it matters: ${reason}\n\nEvidence:\n${quote || '(see source page)'}\n\nSource: ${safeUrl}`
          : quote,
        targetLang: 'English',
        mimeType: 'text/plain',
        error: '',
        kind: 'text-lead',
      };
    })
    .filter((f) => f.ocrText || f.translation);

  if (!findings.length) {
    warnings.push(
      'Text corpus was available, but the director found no citable leads matching your request. Try a search-results URL with your keywords (e.g. Chronicling America search for Tartar/Tartary), enable crawl, and raise max pages.',
    );
  } else {
    warnings.push(
      `Used text-corpus harvest (${chunks.length} page(s), ~${corpusChars} chars) because few/no document images were discoverable on this site.`,
    );
  }

  return {
    ok: true,
    prompt: prompt.trim(),
    strategy: strategy || 'Mine crawled archive text for citable leads.',
    mode: 'text-corpus',
    candidatesConsidered: chunks.length,
    findings,
    pdfs: discovery.pdfs || [],
    roles,
    warnings,
    sourceUrl: discovery.finalUrl || discovery.startUrl || url,
  };
}

/**
 * Run the full AI-directed harvest.
 */
export async function aiHarvest(params) {
  let {
    url,
    prompt,
    count = 10,
    roles: rawRoles,
    keys = {},
    routing = {},
    engine = 'auto',
    crawl = false,
    maxPages = 6,
    maxDepth = 1,
    translate = true,
    targetLang = 'English',
    onProgress = () => {},
  } = params;

  if (!prompt || !prompt.trim()) throw new Error('Describe what you want the AI to find.');
  const roles = mergeRoles(rawRoles);
  const wanted = Math.max(1, Math.min(Number(count) || 8, MAX_HARVEST_FINDINGS));
  const warnings = [];
  let scoutMeta = null;

  // ---- Optional URL: DROC scout finds dig places from the query ----
  if (!url || !String(url).trim()) {
    onProgress({ stage: 'scout', message: 'DROC is finding archive dig sites for your query…' });
    const resolved = await resolveStartUrlFromQuery({
      query: prompt.trim(),
      count: 3,
      roles,
      keys,
      useDirector: true,
    });
    url = resolved.url;
    scoutMeta = resolved.scout;
    warnings.push(
      `No start URL provided — DROC scout started at: ${scoutMeta?.digs?.[0]?.title || url}`,
    );
    // Prefer crawl on scout-resolved search pages so we get past index pages
    if (!crawl) {
      crawl = true;
      maxPages = Math.max(Number(maxPages) || 6, 8);
      warnings.push('Auto-enabled crawl (8+ pages) because DROC started from a search-results URL.');
    }
  } else {
    // Hub homepage → keyword search-results URL (critical for CDLI, Chron Am, etc.)
    const rewritten = resolveArchiveStartUrl(url, prompt.trim());
    if (rewritten.rewritten) {
      warnings.push(rewritten.reason);
      url = rewritten.url;
      if (rewritten.autoCrawl) {
        crawl = true;
        maxPages = Math.max(Number(maxPages) || 6, 10);
        maxDepth = Math.max(Number(maxDepth) || 0, 1);
        warnings.push('Auto-enabled crawl into result / artifact pages from the rewritten search URL.');
      }
    }
  }

  // ---- Discover candidates ----
  onProgress({ stage: 'discover', message: crawl ? 'Crawling site for candidates…' : 'Scanning page for candidates…' });
  const include = { images: true, pdfs: true, docs: true, videos: false };
  const discovery = crawl
    ? await crawlSite({ url, engine, include, includeIcons: false, routing, maxPages, maxDepth, sameHostOnly: true })
    : await scanPage({ url, engine, include, includeIcons: false, routing });

  if (discovery.blocked) {
    warnings.push(
      'The archive may be bot-blocking this route. Try Max stealth engine, residential routing, or a direct search-results URL.',
    );
  }

  const images = discovery.images || [];
  const pdfs = discovery.pdfs || [];
  const candidates = [
    ...images.map((it) => ({ ...it, kind: 'image' })),
    // PDFs are discoverable but Vision OCR needs images — keep as metadata for director context
  ].slice(0, 150);

  // Prefer image OCR path when we have real document-like images
  if (candidates.length >= 1) {
    onProgress({
      stage: 'director',
      message: `${PROVIDERS[roles.director.provider]?.label || roles.director.provider} is choosing image targets…`,
    });
    const pageHint =
      discovery.text && String(discovery.text).trim().length > 100
        ? `\nPage text hint (first 1200 chars):\n"""${String(discovery.text).slice(0, 1200)}"""\n`
        : '';
    const catalog = candidates
      .map((c, i) => `${i}. file="${c.filename}" alt="${(c.alt || '').slice(0, 120)}" url="${(c.url || '').slice(0, 120)}"`)
      .join('\n');
    const directorPrompt =
      `Researcher request:\n"""${prompt.trim()}"""\n\n` +
      `Source: ${discovery.finalUrl || url}\n` +
      (discovery.pages ? `Pages crawled: ${discovery.pages.length}\n` : '') +
      (pdfs.length ? `PDFs also found (not OCR'd here): ${pdfs.length}\n` : '') +
      pageHint +
      `\nCandidate image assets (index. metadata):\n${catalog}\n\n` +
      `Pick the up-to-${wanted} candidates that best match the request. Judge by filename/alt/url cues. ` +
      `Return ONLY JSON: {"strategy":"one sentence on your approach","selections":[{"index":<number>,"reason":"why this one","confidence":0-1,"ocr":true|false}]}. ` +
      `Never select more than ${wanted}. Prefer likely primary-source document scans over decorative/UI images. ` +
      `On CDLI / tablet catalogs, prefer URLs containing /dl/tn_photo/, /dl/photo/, /dl/tn_lineart/, or filenames like P000123.jpg — those ARE tablet scans. ` +
      `For "untranslated / high value" tablet requests: select clear tablet photos even when catalog text is thin; OCR/transliteration is the point. ` +
      `Set ocr:true for tablets, manuscripts, newspaper pages, and captioned plates. ` +
      `Set ocr:false for maps/photos best inspected visually without OCR. Do NOT OCR every image — be selective. ` +
      `If NONE of the images look like primary sources (only logos/icons/UI), return selections:[].`;

    let strategy = '';
    let selections = [];
    try {
      const raw = await runChat({
        provider: roles.director.provider,
        model: roles.director.model,
        byok: keys,
        system: 'You are the director of a research harvest. Respond with strict JSON only.',
        prompt: directorPrompt,
        json: true,
        maxTokens: 2000,
      });
      const parsed = extractJson(raw) || {};
      strategy = String(parsed.strategy || '').slice(0, 400);
      selections = Array.isArray(parsed.selections) ? parsed.selections : [];
    } catch (err) {
      throw new Error(`Director step failed: ${err instanceof Error ? err.message : 'AI error'}`);
    }

    let chosen = selections
      .map((s) => ({ ...s, index: Number(s.index) }))
      .filter((s) => Number.isInteger(s.index) && s.index >= 0 && s.index < candidates.length)
      .slice(0, wanted);

    // Heuristic fallback: CDLI-style tablet thumbs scored as primary sources
    if (!chosen.length) {
      const scored = candidates
        .map((c, index) => ({ index, score: scorePrimarySourceImage(c), c }))
        .filter((x) => x.score >= 8)
        .sort((a, b) => b.score - a.score)
        .slice(0, wanted);
      if (scored.length) {
        chosen = scored.map((x) => ({
          index: x.index,
          reason: 'Primary-source tablet/scan heuristic (catalog photo path).',
          confidence: Math.min(0.9, 0.55 + x.score / 40),
          ocr: true,
        }));
        strategy =
          strategy ||
          'Director returned no picks; selected catalog tablet/scan thumbnails by URL heuristics.';
        warnings.push(
          `Director skipped image picks — auto-selected ${chosen.length} catalog scan(s) that look like primary sources (e.g. CDLI /dl/tn_photo/).`,
        );
      }
    }

    if (chosen.length) {
      const findings = [];
      for (let n = 0; n < chosen.length; n++) {
        const sel = chosen[n];
        const cand = candidates[sel.index];
        const scanUrl = preferFullResolutionScan(cand.url);
        onProgress({ stage: 'ocr', message: `Reading finding ${n + 1}/${chosen.length}: ${cand.filename}`, index: n });
        const finding = {
          url: scanUrl,
          filename: cand.filename,
          alt: cand.alt || '',
          sourceUrl: discovery.finalUrl || url,
          reason: String(sel.reason || '').slice(0, 300),
          confidence: typeof sel.confidence === 'number' ? sel.confidence : null,
          ocrText: '',
          translation: '',
          targetLang: translate ? targetLang : '',
          mimeType: '',
          error: '',
          kind: 'image',
        };
        const wantsOcr = sel.ocr !== false;
        finding.ocrSkipped = !wantsOcr;
        try {
          const asset = await downloadAsset({
            url: scanUrl,
            referer: discovery.finalUrl || url,
            cookies: discovery.cookies,
            routing,
          });
          finding.mimeType = asset.mimeType;
          if (!asset.mimeType.startsWith('image/')) {
            finding.error = 'Not an image — skipped OCR.';
            findings.push(finding);
            continue;
          }
          if (!wantsOcr) {
            finding.ocrText = '';
            finding.reason = `${finding.reason || ''} (visual inspect — OCR skipped by director)`.trim();
            findings.push(finding);
            continue;
          }
          finding.ocrText = await runVision({
            provider: roles.vision.provider,
            model: roles.vision.model,
            byok: keys,
            prompt: OCR_PROMPT,
            images: [asset.base64],
            mimeType: asset.mimeType,
            maxTokens: 3000,
          });
          if (translate && finding.ocrText) {
            onProgress({ stage: 'translate', message: `Translating finding ${n + 1}/${chosen.length}…`, index: n });
            try {
              finding.translation = await runChat({
                provider: roles.translator.provider,
                model: roles.translator.model,
                byok: keys,
                system: TRANSLATE_SYSTEM,
                prompt: `Translate into ${targetLang}:\n\n${finding.ocrText.slice(0, 8000)}`,
                maxTokens: 3000,
              });
            } catch (tErr) {
              warnings.push(`Translation failed for ${cand.filename}: ${tErr instanceof Error ? tErr.message : 'error'}`);
            }
          }
        } catch (err) {
          finding.error = err instanceof Error ? err.message : 'Failed to process finding.';
        }
        findings.push(finding);
      }

      onProgress({ stage: 'done', message: `Harvest complete — ${findings.length} findings.` });
      return {
        ok: true,
        prompt: prompt.trim(),
        strategy,
        mode: 'image-ocr',
        candidatesConsidered: candidates.length,
        findings,
        pdfs,
        roles,
        warnings,
        sourceUrl: discovery.finalUrl || url,
        scout: scoutMeta,
      };
    }

    warnings.push(
      'Images were found, but none looked like primary-source scans for your request — falling back to text-corpus harvest.',
    );
  }

  // ---- Text-corpus fallback (newspapers, catalogs, Chronicling America, etc.) ----
  const textResult = await harvestFromTextCorpus({
    prompt,
    discovery,
    roles,
    keys,
    wanted,
    url,
    warnings,
    onProgress,
  });
  if (textResult) {
    onProgress({ stage: 'done', message: `Text harvest complete — ${textResult.findings.length} lead(s).` });
    return { ...textResult, scout: scoutMeta };
  }

  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  const isChronAm = /chroniclingamerica\.loc\.gov/i.test(host);
  const isCdli = /cdli\.(earth|org|ucla\.edu)/i.test(host);
  const tips = [
    'No document images and not enough usable page text were discovered.',
    'Tips: start from a search-results URL (not the homepage), turn Crawl on, raise max pages to 8–12, try Max stealth.',
  ];
  if (isChronAm) {
    tips.push(
      'For Chronicling America, use a results URL like: https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=Tartar&date1=1850&date2=1922&rows=20&searchType=basic — then crawl 1 link depth into article pages.',
    );
  }
  if (isCdli) {
    tips.push(
      'For CDLI, start on a search-results URL such as https://cdli.earth/search?q=Sumerian (not https://cdli.earth). Enable Crawl so harvest can open /artifacts/N pages with tablet photos.',
    );
  }

  return {
    ok: true,
    prompt: prompt.trim(),
    strategy: '',
    mode: 'empty',
    candidatesConsidered: candidates.length,
    findings: [],
    pdfs,
    roles,
    warnings: [...warnings, ...tips],
    sourceUrl: discovery.finalUrl || discovery.startUrl || url,
    scout: scoutMeta,
  };
}

export { scoutDigPlaces } from './drocScout.js';

/**
 * Standalone translate (Translation Lab), any configured provider.
 */
export async function translateText({ text, targetLang = 'English', provider = 'gemini', model = '', keys = {} }) {
  if (!text || !text.trim()) throw new Error('No text to translate.');
  const clipped = text.slice(0, MAX_TRANSLATE_CHARS);
  const out = await runChat({
    provider,
    model,
    byok: keys,
    system: TRANSLATE_SYSTEM,
    prompt: `Translate the following archival document text into ${targetLang}. Preserve names, dates, and place names.\n\n---\n${clipped}`,
    maxTokens: 4096,
  });
  return { translation: out, targetLang, provider, model: model || PROVIDERS[provider]?.defaultChat };
}
