/**
 * Fable Scrape — stealth web/document/image harvester for historical research.
 *
 * Fetches pages and assets that commonly flag or block automated clients by
 * emulating real browser request signatures (rotating UA + client-hints,
 * browser-like Accept / Sec-Fetch headers, plausible Referer, cookie replay,
 * jittered retries with backoff). When a FIRECRAWL_API_KEY is present, the
 * "max stealth" engine routes page fetches through Firecrawl, which handles
 * heavier anti-bot layers (e.g. Cloudflare) for us.
 *
 * All asset downloads are proxied server-side so the researcher's browser
 * origin is never exposed and CORS never blocks the download.
 */
import dns from 'dns';
import net from 'net';

const dnsLookup = dns.promises.lookup;

/** Realistic desktop browser profiles (UA + matching client hints). */
const BROWSER_PROFILES = [
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    secChUa: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    platform: '"Windows"',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    lang: 'en-US,en;q=0.9',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    secChUa: '',
    platform: '"macOS"',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
    lang: 'en-US,en;q=0.9',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    secChUa: '',
    platform: '"Windows"',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    lang: 'en-US,en;q=0.5',
  },
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"Linux"',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    lang: 'en-US,en;q=0.9',
  },
];

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'jp2', 'heic'];
const DOC_EXT = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'tsv', 'xls', 'xlsx', 'ppt', 'pptx',
  'epub', 'djvu', 'xml', 'json', 'md', 'odt', 'ods', 'pages',
];

function pickProfile(seed) {
  const i = Number.isFinite(seed) ? seed % BROWSER_PROFILES.length : Math.floor(Math.random() * BROWSER_PROFILES.length);
  return BROWSER_PROFILES[i];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('::ffff:')) return isPrivateIp(lower.replace('::ffff:', ''));
    return false;
  }
  return false;
}

/** Reject non-http(s) schemes and anything resolving to a private / internal host (SSRF guard). */
export async function assertPublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are supported.');
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Refusing to fetch an internal host.');
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Refusing to fetch a private/internal address.');
    return parsed;
  }
  try {
    const records = await dnsLookup(host, { all: true });
    if (records.some((r) => isPrivateIp(r.address))) {
      throw new Error('Refusing to fetch a host that resolves to a private/internal address.');
    }
  } catch (err) {
    if (err.message?.includes('private/internal')) throw err;
    // DNS failure will surface naturally on fetch; don't hard-block here.
  }
  return parsed;
}

function buildHeaders(profile, { referer, cookies, isNavigation = true, host } = {}) {
  const headers = {
    'User-Agent': profile.ua,
    Accept: isNavigation ? profile.accept : 'image/avif,image/webp,image/apng,image/svg+xml,*/*;q=0.8',
    'Accept-Language': profile.lang,
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': isNavigation ? 'document' : 'image',
    'Sec-Fetch-Mode': isNavigation ? 'navigate' : 'no-cors',
    'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
    'Sec-Fetch-User': isNavigation ? '?1' : undefined,
    'Cache-Control': 'max-age=0',
  };
  if (profile.secChUa) {
    headers['sec-ch-ua'] = profile.secChUa;
    headers['sec-ch-ua-mobile'] = '?0';
    headers['sec-ch-ua-platform'] = profile.platform;
  }
  if (referer) headers.Referer = referer;
  if (cookies) headers.Cookie = cookies;
  if (host) headers.Host = host;
  // Drop undefined values (fetch dislikes them).
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);
  return headers;
}

function mergeCookies(existing, setCookieHeader) {
  const jar = new Map();
  const add = (str) => {
    if (!str) return;
    str.split(/,(?=[^;]+?=)/).forEach((part) => {
      const kv = part.split(';')[0].trim();
      const eq = kv.indexOf('=');
      if (eq > 0) jar.set(kv.slice(0, eq).trim(), kv.slice(eq + 1).trim());
    });
  };
  if (existing) {
    existing.split(';').forEach((c) => {
      const eq = c.indexOf('=');
      if (eq > 0) jar.set(c.slice(0, eq).trim(), c.slice(eq + 1).trim());
    });
  }
  add(setCookieHeader);
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

/**
 * Fetch a URL emulating a real browser, retrying with rotated profiles and
 * backoff when the origin returns a bot-block status.
 * @returns {Promise<{ response: Response, cookies: string, profileIndex: number }>}
 */
export async function stealthFetch(rawUrl, opts = {}) {
  await assertPublicUrl(rawUrl);
  const {
    referer,
    cookies: initialCookies,
    isNavigation = true,
    maxRetries = 3,
    timeoutMs = 25000,
    method = 'GET',
  } = opts;

  let cookies = initialCookies || '';
  let lastErr;
  const BLOCK_STATUSES = new Set([403, 429, 503, 401, 202]);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const profile = pickProfile(attempt);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const host = new URL(rawUrl).host;
      const res = await fetch(rawUrl, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: buildHeaders(profile, {
          referer: referer || (attempt > 0 ? 'https://www.google.com/' : undefined),
          cookies,
          isNavigation,
          host,
        }),
      });
      clearTimeout(timer);

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookies = mergeCookies(cookies, setCookie);

      if (BLOCK_STATUSES.has(res.status) && attempt < maxRetries) {
        // Likely a soft block / challenge — wait with jitter and rotate profile.
        await sleep(700 * (attempt + 1) + Math.floor(Math.random() * 500));
        lastErr = new Error(`Blocked with status ${res.status}`);
        continue;
      }
      return { response: res, cookies, profileIndex: attempt % BROWSER_PROFILES.length };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < maxRetries) {
        await sleep(600 * (attempt + 1) + Math.floor(Math.random() * 400));
        continue;
      }
    }
  }
  throw lastErr || new Error('Fetch failed after retries.');
}

// ----------------------------- HTML parsing -----------------------------

function decodeEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<head[\s\S]*?<\/head>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function fileNameFromUrl(u, fallbackExt) {
  try {
    const parsed = new URL(u);
    let name = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '');
    name = name.split('?')[0].split('#')[0];
    if (!name || !name.includes('.')) {
      const base = (name || parsed.hostname.replace(/\W+/g, '_') || 'asset').slice(0, 60);
      name = fallbackExt ? `${base}.${fallbackExt}` : base || 'asset';
    }
    return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
  } catch {
    return fallbackExt ? `asset.${fallbackExt}` : 'asset';
  }
}

function extFromUrl(u) {
  try {
    const p = new URL(u).pathname.toLowerCase();
    const m = p.match(/\.([a-z0-9]{1,5})$/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function resolveUrl(base, ref) {
  try {
    return new URL(ref, base).toString();
  } catch {
    return null;
  }
}

/** Parse HTML for downloadable images + documents. */
function parseAssets(html, baseUrl) {
  const images = new Map();
  const documents = new Map();

  const addImage = (url, alt = '') => {
    if (!url) return;
    const abs = resolveUrl(baseUrl, decodeEntities(url).trim());
    if (!abs || abs.startsWith('data:')) return;
    if (!images.has(abs)) {
      images.set(abs, {
        url: abs,
        alt: decodeEntities(alt).trim().slice(0, 200),
        filename: fileNameFromUrl(abs, extFromUrl(abs) && IMAGE_EXT.includes(extFromUrl(abs)) ? extFromUrl(abs) : 'jpg'),
        ext: extFromUrl(abs),
      });
    } else if (alt && !images.get(abs).alt) {
      images.get(abs).alt = decodeEntities(alt).trim().slice(0, 200);
    }
  };

  const addDoc = (url, label = '') => {
    if (!url) return;
    const abs = resolveUrl(baseUrl, decodeEntities(url).trim());
    if (!abs || abs.startsWith('data:')) return;
    const ext = extFromUrl(abs);
    if (!DOC_EXT.includes(ext)) return;
    if (!documents.has(abs)) {
      documents.set(abs, {
        url: abs,
        label: decodeEntities(label).trim().slice(0, 200),
        filename: fileNameFromUrl(abs, ext),
        ext,
      });
    }
  };

  // <img src / data-src / data-original ...>
  const imgTagRe = /<img\b[^>]*>/gi;
  let m;
  while ((m = imgTagRe.exec(html))) {
    const tag = m[0];
    const src =
      (tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-src\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-original\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-lazy-src\s*=\s*["']([^"']+)["']/i) || [])[1];
    const alt = (tag.match(/\salt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    addImage(src, alt);
    // srcset — take the highest-res candidate.
    const srcset = (tag.match(/\ssrcset\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (srcset) {
      const best = srcset
        .split(',')
        .map((s) => s.trim().split(/\s+/)[0])
        .filter(Boolean)
        .pop();
      addImage(best, alt);
    }
  }

  // <source srcset> inside <picture>
  const sourceRe = /<source\b[^>]*\ssrcset\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((m = sourceRe.exec(html))) {
    const best = m[1].split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop();
    addImage(best);
  }

  // og:image / twitter:image
  const metaImgRe = /<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:image|twitter:image)(?::secure_url)?["'][^>]*>/gi;
  while ((m = metaImgRe.exec(html))) {
    const c = (m[0].match(/content\s*=\s*["']([^"']+)["']/i) || [])[1];
    addImage(c);
  }

  // Anchor links — images linked directly + documents.
  const anchorRe = /<a\b[^>]*\shref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = anchorRe.exec(html))) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, ' ').trim();
    const ext = extFromUrl(resolveUrl(baseUrl, href) || href);
    if (IMAGE_EXT.includes(ext)) addImage(href, label);
    else if (DOC_EXT.includes(ext)) addDoc(href, label);
  }

  return {
    images: [...images.values()],
    documents: [...documents.values()],
  };
}

// ----------------------------- Firecrawl -----------------------------

async function firecrawlScrape(apiKey, url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ['markdown', 'html'], onlyMainContent: false }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.error || j.message || detail;
    } catch { /* ignore */ }
    throw new Error(`Firecrawl scrape failed (${res.status}): ${detail}`);
  }
  const json = await res.json();
  const data = json?.data || json || {};
  return {
    markdown: data.markdown || '',
    html: data.html || data.rawHtml || '',
    title: data.metadata?.title || '',
    finalUrl: data.metadata?.sourceURL || data.metadata?.url || url,
  };
}

// ----------------------------- Public API -----------------------------

/**
 * Scan a page: return page text + discovered images/documents.
 * @param {{ url: string, engine?: 'stealth'|'firecrawl'|'auto' }} params
 */
export async function scanPage({ url, engine = 'auto' }) {
  if (!url || typeof url !== 'string') throw new Error('A URL is required.');
  const target = url.trim();
  await assertPublicUrl(target);

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const useFirecrawl = engine === 'firecrawl' || (engine === 'auto' && !!firecrawlKey);

  // Firecrawl path (best against heavy anti-bot). Falls back to stealth on failure.
  if (useFirecrawl && firecrawlKey) {
    try {
      const fc = await firecrawlScrape(firecrawlKey, target);
      const baseUrl = fc.finalUrl || target;
      const assets = parseAssets(fc.html || '', baseUrl);
      const text = fc.markdown || (fc.html ? htmlToText(fc.html) : '');
      return {
        engine: 'firecrawl',
        finalUrl: baseUrl,
        title: fc.title || extractTitle(fc.html || ''),
        text: text.slice(0, 200000),
        textChars: text.length,
        images: assets.images,
        documents: assets.documents,
        cookies: '',
        blocked: false,
      };
    } catch (err) {
      if (engine === 'firecrawl') throw err;
      // else fall through to stealth
    }
  }

  const { response, cookies } = await stealthFetch(target, { isNavigation: true });
  const finalUrl = response.url || target;
  const contentType = response.headers.get('content-type') || '';
  const status = response.status;

  if (!contentType.includes('html') && !contentType.includes('xml') && !contentType.includes('text')) {
    // Direct asset URL (e.g. a PDF or image) — surface it as a single downloadable.
    const ext = extFromUrl(finalUrl);
    const isImage = contentType.startsWith('image/') || IMAGE_EXT.includes(ext);
    const item = {
      url: finalUrl,
      filename: fileNameFromUrl(finalUrl, ext || (isImage ? 'jpg' : 'bin')),
      label: '',
      alt: '',
      ext,
    };
    return {
      engine: 'stealth',
      finalUrl,
      title: item.filename,
      text: '',
      textChars: 0,
      images: isImage ? [item] : [],
      documents: !isImage ? [item] : [],
      cookies,
      blocked: false,
      directAsset: true,
      contentType,
    };
  }

  const html = await response.text();
  const assets = parseAssets(html, finalUrl);
  const text = htmlToText(html);
  const challengeMarker = /(cf-browser-verification|Just a moment\.\.\.|Attention Required!|Checking your browser before|Access Denied|Please enable cookies|hcaptcha|g-recaptcha)/i.test(
    html.slice(0, 8000)
  );
  // Only flag as blocked on an error status, or when a bot-challenge marker
  // shows up on a page that returned almost no real content.
  const blocked = status >= 400 || (challengeMarker && text.length < 1500);

  return {
    engine: 'stealth',
    finalUrl,
    title: extractTitle(html) || finalUrl,
    text: text.slice(0, 200000),
    textChars: text.length,
    images: assets.images,
    documents: assets.documents,
    cookies,
    blocked,
    status,
  };
}

/**
 * Download a single asset (image / document) via the stealth proxy.
 * @param {{ url: string, referer?: string, cookies?: string }} params
 * @returns {Promise<{ filename, mimeType, base64, size }>}
 */
export async function downloadAsset({ url, referer, cookies }) {
  if (!url) throw new Error('An asset URL is required.');
  await assertPublicUrl(url);
  const ext = extFromUrl(url);
  const isImage = IMAGE_EXT.includes(ext);
  const { response } = await stealthFetch(url, {
    referer,
    cookies,
    isNavigation: false,
    timeoutMs: 40000,
  });
  if (!response.ok) throw new Error(`Download failed with status ${response.status}.`);

  const buf = Buffer.from(await response.arrayBuffer());
  const MAX_BYTES = 40 * 1024 * 1024;
  if (buf.length > MAX_BYTES) throw new Error('Asset exceeds 40MB download limit.');

  const mimeType =
    response.headers.get('content-type')?.split(';')[0].trim() ||
    (isImage ? `image/${ext === 'jpg' ? 'jpeg' : ext || 'jpeg'}` : 'application/octet-stream');
  return {
    filename: fileNameFromUrl(url, ext || (mimeType.startsWith('image/') ? 'jpg' : 'bin')),
    mimeType,
    base64: buf.toString('base64'),
    size: buf.length,
  };
}

/**
 * Fetch images via the stealth proxy and convert to base64 JPEG-ish payloads
 * suitable for the OCR pipeline (runOcrOnImages).
 * @param {{ urls: string[], referer?: string, cookies?: string }} params
 * @returns {Promise<{ images: string[], fetched: number, failed: {url,error}[] }>}
 */
export async function fetchImagesForOcr({ urls, referer, cookies }) {
  const list = (Array.isArray(urls) ? urls : []).slice(0, 100);
  if (!list.length) throw new Error('No image URLs provided.');
  const images = [];
  const failed = [];
  for (const url of list) {
    try {
      const asset = await downloadAsset({ url, referer, cookies });
      if (!asset.mimeType.startsWith('image/')) {
        failed.push({ url, error: 'Not an image.' });
        continue;
      }
      images.push(asset.base64);
    } catch (err) {
      failed.push({ url, error: err instanceof Error ? err.message : 'Fetch failed' });
    }
  }
  return { images, fetched: images.length, failed };
}
