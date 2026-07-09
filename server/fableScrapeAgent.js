/**
 * Fable Scrape — AI-directed harvest orchestrator.
 *
 * Chains, in this fixed order:
 *   1. DIRECTOR (default Grok) reads the user's plain-English instruction plus
 *      the discovered candidates and intelligently SELECTS which items to pull.
 *   2. VISION/OCR (default Gemini 2.5) reads the actual selected images.
 *   3. TRANSLATOR (default Gemini 2.5) translates the OCR'd findings.
 * Each role's provider/model is configurable (Grok, Gemini, Claude, Kimi,
 * DeepSeek) with per-request BYOK keys. Findings can then be published to the
 * communal library.
 */
import { scanPage, crawlSite, downloadAsset } from './fableScrape.js';
import { runChat, runVision, extractJson, PROVIDERS } from './fableScrapeProviders.js';

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

const TRANSLATE_SYSTEM =
  'You are an expert archival translator. Translate the supplied document text into the requested language. ' +
  'Preserve names, dates, and place names exactly. If the source language or script is uncertain, add a short ' +
  'bracketed note. Return only the translation.';

const OCR_PROMPT =
  'You are an expert palaeographer and OCR system. Transcribe ALL text visible in this image exactly as it appears, ' +
  'preserving line breaks and layout. If the script is ancient or non-Latin (e.g. cuneiform, hieroglyphic, ' +
  'medieval hand), transliterate what you can and describe any untranscribable marks. Do not invent content.';

/**
 * Run the full AI-directed harvest.
 * @param {object} params
 * @param {string} params.url          start URL
 * @param {string} params.prompt       user's natural-language instruction
 * @param {number} [params.count]      max findings to return (<=15)
 * @param {object} [params.roles]      { director, vision, translator } each { provider, model }
 * @param {object} [params.keys]       BYOK map provider->key
 * @param {object} [params.routing]    IP routing
 * @param {string} [params.engine]     stealth engine
 * @param {boolean}[params.crawl]      crawl vs single page
 * @param {number} [params.maxPages]
 * @param {number} [params.maxDepth]
 * @param {boolean}[params.translate]  translate findings (default true)
 * @param {string} [params.targetLang] translation target (default English)
 * @param {(ev:object)=>void} [params.onProgress]
 */
export async function aiHarvest(params) {
  const {
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

  if (!url) throw new Error('A start URL is required.');
  if (!prompt || !prompt.trim()) throw new Error('Describe what you want the AI to find.');
  const roles = mergeRoles(rawRoles);
  const wanted = Math.max(1, Math.min(Number(count) || 10, 15));
  const warnings = [];

  // ---- Discover candidates ----
  onProgress({ stage: 'discover', message: crawl ? 'Crawling site for candidates…' : 'Scanning page for candidates…' });
  const include = { images: true, pdfs: true, docs: false, videos: false };
  const discovery = crawl
    ? await crawlSite({ url, engine, include, includeIcons: false, routing, maxPages, maxDepth, sameHostOnly: true })
    : await scanPage({ url, engine, include, includeIcons: false, routing });

  const images = discovery.images || [];
  const pdfs = discovery.pdfs || [];
  const candidates = [...images.map((it) => ({ ...it, kind: 'image' }))].slice(0, 150);
  if (!candidates.length) {
    return {
      ok: true,
      strategy: '',
      candidatesConsidered: 0,
      findings: [],
      pdfs,
      roles,
      warnings: ['No images were discovered to analyze. Try crawl mode, a deeper link depth, or Max stealth.'],
      sourceUrl: discovery.finalUrl || url,
    };
  }

  // ---- 1. DIRECTOR selects ----
  onProgress({ stage: 'director', message: `${PROVIDERS[roles.director.provider]?.label || roles.director.provider} is choosing targets…` });
  const catalog = candidates
    .map((c, i) => `${i}. file="${c.filename}" alt="${(c.alt || '').slice(0, 120)}"`)
    .join('\n');
  const directorPrompt =
    `Researcher request:\n"""${prompt.trim()}"""\n\n` +
    `Source: ${discovery.finalUrl || url}\n` +
    (discovery.pages ? `Pages crawled: ${discovery.pages.length}\n` : '') +
    `\nCandidate assets (index. metadata):\n${catalog}\n\n` +
    `Pick the up-to-${wanted} candidates that best match the request. Judge by filename/alt cues. ` +
    `Return ONLY JSON: {"strategy":"one sentence on your approach","selections":[{"index":<number>,"reason":"why this one","confidence":0-1}]}. ` +
    `Never select more than ${wanted}. Prefer likely primary-source document scans over decorative/UI images.`;

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

  const chosen = selections
    .map((s) => ({ ...s, index: Number(s.index) }))
    .filter((s) => Number.isInteger(s.index) && s.index >= 0 && s.index < candidates.length)
    .slice(0, wanted);

  if (!chosen.length) {
    warnings.push('The director did not select any candidates for this request.');
    return { ok: true, strategy, candidatesConsidered: candidates.length, findings: [], pdfs, roles, warnings, sourceUrl: discovery.finalUrl || url };
  }

  // ---- 2 & 3. VISION (OCR) + TRANSLATE each finding ----
  const findings = [];
  for (let n = 0; n < chosen.length; n++) {
    const sel = chosen[n];
    const cand = candidates[sel.index];
    onProgress({ stage: 'ocr', message: `Reading finding ${n + 1}/${chosen.length}: ${cand.filename}`, index: n });
    const finding = {
      url: cand.url,
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
    };
    try {
      const asset = await downloadAsset({ url: cand.url, referer: discovery.finalUrl || url, cookies: discovery.cookies, routing });
      finding.mimeType = asset.mimeType;
      if (!asset.mimeType.startsWith('image/')) {
        finding.error = 'Not an image — skipped OCR.';
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
    candidatesConsidered: candidates.length,
    findings,
    pdfs,
    roles,
    warnings,
    sourceUrl: discovery.finalUrl || url,
  };
}

/**
 * Standalone translate (Translation Lab), any configured provider.
 * @param {{ text:string, targetLang?:string, provider?:string, model?:string, keys?:object }} params
 */
export async function translateText({ text, targetLang = 'English', provider = 'gemini', model = '', keys = {} }) {
  if (!text || !text.trim()) throw new Error('No text to translate.');
  const out = await runChat({
    provider,
    model,
    byok: keys,
    system: TRANSLATE_SYSTEM,
    prompt: `Translate the following archival document text into ${targetLang}. Preserve names, dates, and place names.\n\n---\n${text.slice(0, 12000)}`,
    maxTokens: 4096,
  });
  return { translation: out, targetLang, provider, model: model || PROVIDERS[provider]?.defaultChat };
}
