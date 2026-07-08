/**
 * Fable Scrape — stealth archive harvester for Old World Research.
 * Built on Firecrawl with archive-focused link extraction and keyword filtering.
 */
import { requireFirecrawlKey } from './intelCloudKeys.js';
import { firecrawlWebSearch } from './intelFirecrawl.js';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|tiff?|bmp|svg)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;
const TEXT_EXT = /\.(txt|md|html?|rtf|docx?|xml|json)(\?|#|$)/i;

function readFirecrawlError(res) {
  return res.json().catch(() => ({ error: res.statusText }));
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function extractUrlsFromMarkdown(md, baseUrl) {
  const urls = new Set();
  const text = String(md || '');
  const linkRe = /https?:\/\/[^\s)\]"'<>]+/gi;
  for (const m of text.matchAll(linkRe)) urls.add(m[0].replace(/[.,;]+$/, ''));
  const mdLinkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const m of text.matchAll(mdLinkRe)) {
    const href = m[1].trim();
    if (href.startsWith('http')) urls.add(href);
    else if (href.startsWith('/') && baseUrl) {
      try {
        urls.add(new URL(href, baseUrl).href);
      } catch {
        /* ignore */
      }
    }
  }
  return [...urls];
}

function classifyUrl(url, fileTypes) {
  if (!url || !fileTypes) return null;
  if (fileTypes.images && IMAGE_EXT.test(url)) return 'image';
  if (fileTypes.pdfs && PDF_EXT.test(url)) return 'pdf';
  if (fileTypes.text && (TEXT_EXT.test(url) || (!IMAGE_EXT.test(url) && !PDF_EXT.test(url)))) {
    return 'text';
  }
  return null;
}

function keywordHits(text, keywords) {
  const lower = String(text || '').toLowerCase();
  return keywords.filter((k) => k && lower.includes(k.toLowerCase()));
}

function filterTextByKeywords(text, keywords) {
  if (!keywords.length) return text;
  const paras = String(text || '').split(/\n{2,}/);
  const matched = paras.filter((p) => keywordHits(p, keywords).length > 0);
  return matched.length ? matched.join('\n\n') : text.slice(0, 12000);
}

async function fableScrapeUrl(apiKey, url, opts = {}) {
  const body = {
    url,
    formats: ['markdown', 'links'],
    onlyMainContent: true,
    timeout: opts.timeout ?? 45000,
  };
  if (opts.superStealth) {
    body.waitFor = 4000;
    body.headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
  }

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await readFirecrawlError(res);
    throw new Error(`Fable scrape failed (${res.status}): ${err.error || err.message || 'unknown'}`);
  }

  const json = await res.json();
  if (json?.success === false) {
    throw new Error(json.error || json.message || 'Fable scrape error');
  }

  const md = json?.data?.markdown ?? json?.markdown ?? '';
  const links = json?.data?.links ?? json?.links ?? [];
  const allUrls = [...new Set([...links, ...extractUrlsFromMarkdown(md, url)])];
  return { url, markdown: String(md), links: allUrls };
}

function harvestAssets(pages, fileTypes, keywords) {
  const assets = { images: [], pdfs: [], textUrls: [] };
  const seen = new Set();

  for (const page of pages) {
    for (const link of page.links || []) {
      if (seen.has(link)) continue;
      const kind = classifyUrl(link, fileTypes);
      if (!kind) continue;
      if (keywords.length && !keywordHits(link, keywords).length) {
        const pathLower = link.toLowerCase();
        const hasKw = keywords.some((k) => pathLower.includes(k.toLowerCase()));
        if (!hasKw) continue;
      }
      seen.add(link);
      if (kind === 'image') assets.images.push(link);
      else if (kind === 'pdf') assets.pdfs.push(link);
      else assets.textUrls.push(link);
    }
  }

  assets.images = assets.images.slice(0, 80);
  assets.pdfs = assets.pdfs.slice(0, 40);
  assets.textUrls = assets.textUrls.slice(0, 40);
  return assets;
}

function buildOutputText(pages, assets, keywords) {
  const lines = [];
  lines.push('# Fable Scrape results\n');
  if (keywords.length) {
    lines.push(`**Focus keywords:** ${keywords.join(', ')}\n`);
  }
  lines.push(
    `**Harvested:** ${pages.length} page(s) · ${assets.images.length} images · ${assets.pdfs.length} PDFs · ${assets.textUrls.length} text/doc URLs\n`
  );

  for (const page of pages) {
    const hits = keywordHits(page.markdown, keywords);
    lines.push(`## ${page.url}`);
    if (hits.length) lines.push(`_Keyword hits: ${hits.join(', ')}_`);
    const body = filterTextByKeywords(page.markdown, keywords).slice(0, 6000);
    lines.push(body || '(no text extracted)');
    lines.push('');
  }

  if (assets.images.length) {
    lines.push('## Image archives');
    assets.images.forEach((u, i) => lines.push(`${i + 1}. ${u}`));
    lines.push('');
  }
  if (assets.pdfs.length) {
    lines.push('## PDF archives');
    assets.pdfs.forEach((u, i) => lines.push(`${i + 1}. ${u}`));
    lines.push('');
  }
  if (assets.textUrls.length) {
    lines.push('## Text / document URLs');
    assets.textUrls.forEach((u, i) => lines.push(`${i + 1}. ${u}`));
  }

  return lines.join('\n');
}

/**
 * @param {object} opts
 * @param {string} [opts.url]
 * @param {string} [opts.query]
 * @param {boolean} [opts.superStealth]
 * @param {boolean} [opts.massResearch]
 * @param {string[]} [opts.keywords]
 * @param {{ images?: boolean, text?: boolean, pdfs?: boolean }} [opts.fileTypes]
 */
export async function runFableScrape(opts = {}) {
  const apiKey = requireFirecrawlKey();
  const superStealth = Boolean(opts.superStealth);
  const massResearch = Boolean(opts.massResearch);
  const keywords = (opts.keywords || [])
    .map((k) => String(k).trim())
    .filter(Boolean);
  const fileTypes = {
    images: opts.fileTypes?.images !== false,
    text: opts.fileTypes?.text !== false,
    pdfs: opts.fileTypes?.pdfs !== false,
  };

  const timeout = superStealth ? 90000 : 50000;
  const scrapeDelay = superStealth ? 1200 : 400;
  const pages = [];
  const errors = [];

  const seedUrl = String(opts.url || '').trim();
  const query = String(opts.query || '').trim();

  if (seedUrl) {
    try {
      const page = await fableScrapeUrl(apiKey, seedUrl, { superStealth, timeout });
      pages.push(page);
    } catch (e) {
      errors.push({ url: seedUrl, error: e.message });
    }
  }

  const searchQuery =
    query ||
    (massResearch && seedUrl && safeHostname(seedUrl)
      ? `site:${safeHostname(seedUrl)} archive`
      : '');
  if (searchQuery) {
    const searchLimit = massResearch ? (superStealth ? 10 : 15) : superStealth ? 6 : 8;
    const search = await firecrawlWebSearch(apiKey, searchQuery, {
      limit: searchLimit,
      timeout,
    });

    const resultBlock = search.data || '';
    const urlRe = /URL:\s*(https?:\/\/[^\s]+)/gi;
    const foundUrls = new Set();
    for (const m of resultBlock.matchAll(urlRe)) foundUrls.add(m[1].trim());

    const toScrape = massResearch
      ? [...foundUrls].slice(0, superStealth ? 8 : 12)
      : seedUrl
        ? [...foundUrls].filter((u) => u !== seedUrl).slice(0, 3)
        : [...foundUrls].slice(0, 1);

    for (const target of toScrape) {
      if (pages.some((p) => p.url === target)) continue;
      try {
        if (scrapeDelay) await new Promise((r) => setTimeout(r, scrapeDelay));
        const page = await fableScrapeUrl(apiKey, target, { superStealth, timeout });
        pages.push(page);
      } catch (e) {
        errors.push({ url: target, error: e.message });
      }
    }
  }

  if (!pages.length && !errors.length) {
    throw new Error('Provide an archive URL and/or search query for Fable Scrape.');
  }

  const assets = harvestAssets(pages, fileTypes, keywords);
  const text = buildOutputText(pages, assets, keywords);

  return {
    summary: `Fable Scrape: ${pages.length} page(s), ${assets.images.length} images, ${assets.pdfs.length} PDFs`,
    text,
    pages: pages.map((p) => ({
      url: p.url,
      chars: p.markdown.length,
      keywordHits: keywordHits(p.markdown, keywords),
    })),
    assets,
    errors,
    modes: { superStealth, massResearch },
    fileTypes,
  };
}
