/**
 * Fable Scrape — stealth, all-in-one web/document/image/video harvester.
 *
 * Fetches pages and assets that commonly flag or block automated clients by
 * emulating real browser request signatures (rotating UA + client-hints,
 * browser-like Accept / Sec-Fetch headers, plausible Referer, cookie replay,
 * jittered retries with backoff). When a FIRECRAWL_API_KEY is present, the
 * "max stealth" engine routes page fetches through Firecrawl, which handles
 * heavier anti-bot layers (e.g. Cloudflare) for us.
 *
 * Traffic routing (so the shared AiBhive host IP never gets banned):
 *   - browser     → the frontend fetches everything client-side (the user's
 *                   own IP). These server endpoints are NOT used in that mode.
 *   - residential → server routes through AiBhive's rotating residential proxy
 *                   pool (env FABLE_SCRAPE_PROXIES / FABLE_SCRAPE_RESIDENTIAL_PROXY).
 *   - custom      → server routes through a proxy URL supplied by the caller.
 *   - server      → server-direct (shared host IP) — advanced/fallback only.
 */
import dns from 'dns';
import net from 'net';
import { ProxyAgent } from 'undici';

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
const PDF_EXT = ['pdf'];
const DOC_EXT = [
  'doc', 'docx', 'txt', 'rtf', 'csv', 'tsv', 'xls', 'xlsx', 'ppt', 'pptx',
  'epub', 'djvu', 'xml', 'json', 'md', 'odt', 'ods', 'pages',
];
const VIDEO_EXT = [
  'mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'ogv', 'flv', 'wmv', '3gp',
  'mpg', 'mpeg', 'm2ts', 'ts', 'm3u8', 'mpd',
];
// Extensions that are never crawlable "pages".
const NON_PAGE_EXT = new Set([...IMAGE_EXT, ...PDF_EXT, ...DOC_EXT, ...VIDEO_EXT,
  'css', 'js', 'mjs', 'zip', 'gz', 'tar', 'rar', '7z', 'woff', 'woff2', 'ttf', 'ico', 'mp3', 'wav', 'flac']);

const DEFAULT_INCLUDE = { images: true, pdfs: true, docs: true, videos: true };

// ------------------------- Proxy / routing -------------------------

const dispatcherCache = new Map();

function getDispatcher(proxyUrl) {
  if (!proxyUrl) return undefined;
  if (dispatcherCache.has(proxyUrl)) return dispatcherCache.get(proxyUrl);
  const agent = new ProxyAgent({ uri: proxyUrl });
  dispatcherCache.set(proxyUrl, agent);
  return agent;
}

function residentialPool() {
  const list = String(process.env.FABLE_SCRAPE_PROXIES || '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const gateway = String(process.env.FABLE_SCRAPE_RESIDENTIAL_PROXY || '').trim();
  if (gateway) list.push(gateway);
  return list;
}

/** Availability + rotation info for the residential proxy pool (for the UI). */
export function residentialProxyStatus() {
  const pool = residentialPool();
  return {
    available: pool.length > 0,
    // A single provider "gateway" URL usually rotates IPs per-request on their
    // side, so treat any configured pool as rotating.
    rotating: pool.length >= 1,
    count: pool.length,
  };
}

function pickResidentialProxy() {
  const pool = residentialPool();
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function validateProxyUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('Invalid proxy URL.');
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new Error('Proxy URL must be http(s). SOCKS proxies are not supported.');
  }
  return u.toString();
}

/**
 * Resolve the outbound proxy for a server-side request based on the caller's
 * routing choice. Throws for modes that must not touch the server.
 * @param {{ mode?: string, proxyUrl?: string }} routing
 * @returns {string|null} proxy URL, or null for host-direct
 */
export function resolveProxyForRequest(routing = {}) {
  const mode = routing.mode || 'server';
  if (mode === 'browser') {
    // Bulk asset downloads happen in the user's browser (their IP). Page
    // discovery (a single lightweight request per page) still runs host-direct
    // because cross-origin CORS almost always blocks client-side HTML reads.
    return null;
  }
  if (mode === 'residential') {
    const proxy = pickResidentialProxy();
    if (!proxy) {
      throw new Error(
        'AiBhive residential proxies are not configured on this server. Set FABLE_SCRAPE_RESIDENTIAL_PROXY or use another routing mode.'
      );
    }
    return proxy;
  }
  if (mode === 'custom') {
    if (!routing.proxyUrl) throw new Error('Custom routing selected but no proxy URL was provided.');
    return validateProxyUrl(routing.proxyUrl);
  }
  // 'server' / default → host-direct
  return null;
}

/**
 * Verify a proxy works and report the egress IP it presents to targets.
 * Used by the UI "Test connection" button for residential/custom proxies.
 * @param {{ mode?:string, proxyUrl?:string }} routing
 */
export async function testProxyConnection(routing = {}) {
  const proxyUrl = resolveProxyForRequest(routing);
  const dispatcher = getDispatcher(proxyUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      ...(dispatcher ? { dispatcher } : {}),
      headers: { 'User-Agent': BROWSER_PROFILES[0].ua, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Proxy check returned status ${res.status}.`);
    const json = await res.json();
    return {
      ok: true,
      exitIp: json.ip || 'unknown',
      routed: !!proxyUrl,
      mode: routing.mode || 'server',
    };
  } catch (err) {
    throw new Error(
      `Proxy test failed: ${err instanceof Error ? err.message : 'unreachable'}. Check the host, port, and credentials.`
    );
  } finally {
    clearTimeout(timer);
  }
}

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
    Accept: isNavigation ? profile.accept : 'image/avif,image/webp,image/apng,video/*,application/pdf,*/*;q=0.8',
    'Accept-Language': profile.lang,
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': isNavigation ? 'document' : 'empty',
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
 * backoff when the origin returns a bot-block status. Optionally routed through
 * a proxy so the target never sees the AiBhive host IP.
 * @returns {Promise<{ response: Response, cookies: string }>}
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
    proxyUrl = null,
  } = opts;

  const dispatcher = getDispatcher(proxyUrl);
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
        ...(dispatcher ? { dispatcher } : {}),
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
        await sleep(700 * (attempt + 1) + Math.floor(Math.random() * 500));
        lastErr = new Error(`Blocked with status ${res.status}`);
        continue;
      }
      return { response: res, cookies };
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

/** Heuristic: is this image likely a UI icon / logo / sprite rather than content? */
function isIconLike(url, alt = '') {
  const s = `${url} ${alt}`.toLowerCase();
  if (/(favicon|sprite|\bicon\b|icons\/|\blogo\b|badge|spinner|loader|blank\.|spacer|1x1|pixel\.|placeholder|avatar)/.test(s)) {
    return true;
  }
  // -16x16 / _24x24 style dimension hints where both sides are small.
  const dim = url.match(/[_-](\d{1,3})x(\d{1,3})\b/);
  if (dim && Number(dim[1]) <= 48 && Number(dim[2]) <= 48) return true;
  return false;
}

/**
 * Parse HTML for downloadable images / pdfs / documents / videos.
 * @param {string} html
 * @param {string} baseUrl
 * @param {{ images?:boolean, pdfs?:boolean, docs?:boolean, videos?:boolean, includeIcons?:boolean }} opts
 */
function parseAssets(html, baseUrl, opts = {}) {
  const include = { ...DEFAULT_INCLUDE, ...opts };
  const includeIcons = !!opts.includeIcons;
  const images = new Map();
  const pdfs = new Map();
  const documents = new Map();
  const videos = new Map();

  const addImage = (url, alt = '') => {
    if (!include.images || !url) return;
    const abs = resolveUrl(baseUrl, decodeEntities(url).trim());
    if (!abs || abs.startsWith('data:')) return;
    const iconLikely = isIconLike(abs, alt);
    if (iconLikely && !includeIcons) return;
    if (!images.has(abs)) {
      images.set(abs, {
        url: abs,
        alt: decodeEntities(alt).trim().slice(0, 200),
        filename: fileNameFromUrl(abs, IMAGE_EXT.includes(extFromUrl(abs)) ? extFromUrl(abs) : 'jpg'),
        ext: extFromUrl(abs),
        iconLikely,
      });
    } else if (alt && !images.get(abs).alt) {
      images.get(abs).alt = decodeEntities(alt).trim().slice(0, 200);
    }
  };

  const addFile = (url, label = '') => {
    if (!url) return;
    const abs = resolveUrl(baseUrl, decodeEntities(url).trim());
    if (!abs || abs.startsWith('data:')) return;
    const ext = extFromUrl(abs);
    const item = { url: abs, label: decodeEntities(label).trim().slice(0, 200), filename: fileNameFromUrl(abs, ext), ext };
    if (PDF_EXT.includes(ext)) {
      if (include.pdfs && !pdfs.has(abs)) pdfs.set(abs, item);
    } else if (VIDEO_EXT.includes(ext)) {
      if (include.videos && !videos.has(abs)) videos.set(abs, item);
    } else if (DOC_EXT.includes(ext)) {
      if (include.docs && !documents.has(abs)) documents.set(abs, item);
    } else if (IMAGE_EXT.includes(ext)) {
      addImage(abs, label);
    }
  };

  const addVideo = (url, label = '') => {
    if (!include.videos || !url) return;
    const abs = resolveUrl(baseUrl, decodeEntities(url).trim());
    if (!abs || abs.startsWith('data:')) return;
    if (!videos.has(abs)) {
      videos.set(abs, { url: abs, label: decodeEntities(label).trim().slice(0, 200), filename: fileNameFromUrl(abs, extFromUrl(abs) || 'mp4'), ext: extFromUrl(abs) });
    }
  };

  let m;
  // <img ...>
  const imgTagRe = /<img\b[^>]*>/gi;
  while ((m = imgTagRe.exec(html))) {
    const tag = m[0];
    const src =
      (tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-src\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-original\s*=\s*["']([^"']+)["']/i) || [])[1] ||
      (tag.match(/\sdata-lazy-src\s*=\s*["']([^"']+)["']/i) || [])[1];
    const alt = (tag.match(/\salt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    addImage(src, alt);
    const srcset = (tag.match(/\ssrcset\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (srcset) {
      const best = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop();
      addImage(best, alt);
    }
  }

  // <source srcset> (picture) and <source src> (video/audio)
  const sourceRe = /<source\b[^>]*>/gi;
  while ((m = sourceRe.exec(html))) {
    const tag = m[0];
    const srcset = (tag.match(/\ssrcset\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (srcset) {
      const best = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop();
      addImage(best);
    }
    const src = (tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1];
    const type = (tag.match(/\stype\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (src) {
      if (/^video\//i.test(type) || VIDEO_EXT.includes(extFromUrl(resolveUrl(baseUrl, src) || src))) addVideo(src);
    }
  }

  // <video src> and <video><source>
  const videoTagRe = /<video\b[^>]*>/gi;
  while ((m = videoTagRe.exec(html))) {
    const src = (m[0].match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1];
    const poster = (m[0].match(/\sposter\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (src) addVideo(src);
    if (poster) addImage(poster);
  }

  // og:image / twitter:image / og:video
  const metaRe = /<meta\b[^>]*>/gi;
  while ((m = metaRe.exec(html))) {
    const tag = m[0];
    const key = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    const content = (tag.match(/content\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!content) continue;
    if (/^(og:image|twitter:image)(:secure_url)?$/i.test(key)) addImage(content);
    if (/^(og:video|og:video:url|og:video:secure_url|twitter:player:stream)$/i.test(key)) addVideo(content);
  }

  // Anchor links — images / pdfs / docs / videos linked directly.
  const anchorRe = /<a\b[^>]*\shref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = anchorRe.exec(html))) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, ' ').trim();
    addFile(href, label);
  }

  return {
    images: [...images.values()],
    pdfs: [...pdfs.values()],
    documents: [...documents.values()],
    videos: [...videos.values()],
  };
}

/** Extract same-host (or any-host) crawlable page links. */
function extractLinks(html, baseUrl, restrictHost) {
  const out = new Set();
  const anchorRe = /<a\b[^>]*\shref\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = anchorRe.exec(html))) {
    const abs = resolveUrl(baseUrl, decodeEntities(m[1]).trim());
    if (!abs) continue;
    let u;
    try {
      u = new URL(abs);
    } catch {
      continue;
    }
    if (!['http:', 'https:'].includes(u.protocol)) continue;
    if (restrictHost && u.host !== restrictHost) continue;
    if (NON_PAGE_EXT.has(extFromUrl(abs))) continue;
    u.hash = '';
    out.add(u.toString());
  }
  return [...out];
}

function normalizePageUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.toString();
  } catch {
    return u;
  }
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
 * Scan a single page: return page text + discovered assets, filtered by
 * content type. Routed through the selected proxy (or host-direct).
 * @param {{ url:string, engine?:string, include?:object, includeIcons?:boolean, routing?:object }} params
 */
export async function scanPage({ url, engine = 'auto', include, includeIcons = false, routing = {} }) {
  if (!url || typeof url !== 'string') throw new Error('A URL is required.');
  const target = url.trim();
  await assertPublicUrl(target);
  const inc = { ...DEFAULT_INCLUDE, ...(include || {}) };
  const proxyUrl = resolveProxyForRequest(routing);

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const useFirecrawl = engine === 'firecrawl' || (engine === 'auto' && !!firecrawlKey);

  if (useFirecrawl && firecrawlKey) {
    try {
      const fc = await firecrawlScrape(firecrawlKey, target);
      const baseUrl = fc.finalUrl || target;
      const assets = parseAssets(fc.html || '', baseUrl, { ...inc, includeIcons });
      const text = fc.markdown || (fc.html ? htmlToText(fc.html) : '');
      return {
        engine: 'firecrawl',
        routingMode: routing.mode || 'server',
        finalUrl: baseUrl,
        title: fc.title || extractTitle(fc.html || ''),
        text: text.slice(0, 200000),
        textChars: text.length,
        ...assets,
        cookies: '',
        blocked: false,
      };
    } catch (err) {
      if (engine === 'firecrawl') throw err;
    }
  }

  const { response, cookies } = await stealthFetch(target, { isNavigation: true, proxyUrl });
  const finalUrl = response.url || target;
  const contentType = response.headers.get('content-type') || '';
  const status = response.status;

  if (!contentType.includes('html') && !contentType.includes('xml') && !contentType.includes('text')) {
    const ext = extFromUrl(finalUrl);
    const isImage = contentType.startsWith('image/') || IMAGE_EXT.includes(ext);
    const isVideo = contentType.startsWith('video/') || VIDEO_EXT.includes(ext);
    const isPdf = contentType.includes('pdf') || PDF_EXT.includes(ext);
    const item = { url: finalUrl, filename: fileNameFromUrl(finalUrl, ext || 'bin'), label: '', alt: '', ext };
    return {
      engine: 'stealth',
      routingMode: routing.mode || 'server',
      finalUrl,
      title: item.filename,
      text: '',
      textChars: 0,
      images: isImage ? [{ ...item, iconLikely: false }] : [],
      pdfs: isPdf ? [item] : [],
      documents: !isImage && !isVideo && !isPdf ? [item] : [],
      videos: isVideo ? [item] : [],
      cookies,
      blocked: false,
      directAsset: true,
      contentType,
    };
  }

  const html = await response.text();
  const assets = parseAssets(html, finalUrl, { ...inc, includeIcons });
  const text = htmlToText(html);
  const challengeMarker = /(cf-browser-verification|Just a moment\.\.\.|Attention Required!|Checking your browser before|Access Denied|Please enable cookies|hcaptcha|g-recaptcha)/i.test(
    html.slice(0, 8000)
  );
  const blocked = status >= 400 || (challengeMarker && text.length < 1500);

  return {
    engine: 'stealth',
    routingMode: routing.mode || 'server',
    finalUrl,
    title: extractTitle(html) || finalUrl,
    text: text.slice(0, 200000),
    textChars: text.length,
    ...assets,
    cookies,
    blocked,
    status,
  };
}

const CRAWL_LIMITS = { maxPages: 40, maxDepth: 4, maxAssets: 4000, timeBudgetMs: 120000 };

/**
 * Multi-page crawl. BFS from startUrl within caps, aggregating assets.
 * @param {{ url:string, include?:object, includeIcons?:boolean, routing?:object,
 *           maxPages?:number, maxDepth?:number, sameHostOnly?:boolean }} params
 */
export async function crawlSite({
  url,
  include,
  includeIcons = false,
  routing = {},
  maxPages = 5,
  maxDepth = 1,
  sameHostOnly = true,
}) {
  if (!url || typeof url !== 'string') throw new Error('A start URL is required.');
  const start = url.trim();
  await assertPublicUrl(start);
  const inc = { ...DEFAULT_INCLUDE, ...(include || {}) };
  const proxyUrl = resolveProxyForRequest(routing);

  const pageCap = Math.max(1, Math.min(Number(maxPages) || 1, CRAWL_LIMITS.maxPages));
  const depthCap = Math.max(0, Math.min(Number(maxDepth) || 0, CRAWL_LIMITS.maxDepth));
  const startHost = new URL(start).host;

  const images = new Map();
  const pdfs = new Map();
  const documents = new Map();
  const videos = new Map();
  const merge = (map, arr) => arr.forEach((it) => !map.has(it.url) && map.set(it.url, it));

  const queue = [{ url: start, depth: 0 }];
  const visited = new Set();
  const pages = [];
  const deadline = Date.now() + CRAWL_LIMITS.timeBudgetMs;
  let cookies = '';
  let stoppedReason = null;

  while (queue.length && pages.length < pageCap) {
    if (Date.now() > deadline) {
      stoppedReason = 'time budget reached';
      break;
    }
    const { url: pageUrl, depth } = queue.shift();
    const norm = normalizePageUrl(pageUrl);
    if (visited.has(norm)) continue;
    visited.add(norm);

    let response;
    try {
      const r = await stealthFetch(pageUrl, { isNavigation: true, cookies, proxyUrl, timeoutMs: 20000 });
      response = r.response;
      if (r.cookies) cookies = r.cookies;
    } catch {
      continue;
    }
    const ct = response.headers.get('content-type') || '';
    if (!/(html|xml|text)/.test(ct)) continue;

    let html;
    try {
      html = await response.text();
    } catch {
      continue;
    }
    const finalUrl = response.url || pageUrl;
    const assets = parseAssets(html, finalUrl, { ...inc, includeIcons });
    merge(images, assets.images);
    merge(pdfs, assets.pdfs);
    merge(documents, assets.documents);
    merge(videos, assets.videos);
    pages.push({
      url: finalUrl,
      title: extractTitle(html) || finalUrl,
      images: assets.images.length,
      pdfs: assets.pdfs.length,
      documents: assets.documents.length,
      videos: assets.videos.length,
    });

    if (images.size + pdfs.size + documents.size + videos.size > CRAWL_LIMITS.maxAssets) {
      stoppedReason = 'asset limit reached';
      break;
    }

    if (depth < depthCap) {
      for (const link of extractLinks(html, finalUrl, sameHostOnly ? startHost : null)) {
        const n = normalizePageUrl(link);
        if (!visited.has(n) && queue.length + pages.length < pageCap * 6) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    }
    await sleep(250 + Math.floor(Math.random() * 400));
  }

  if (!stoppedReason && queue.length) stoppedReason = 'page limit reached';

  return {
    engine: 'stealth',
    routingMode: routing.mode || 'server',
    startUrl: start,
    pagesVisited: pages.length,
    pages,
    images: [...images.values()],
    pdfs: [...pdfs.values()],
    documents: [...documents.values()],
    videos: [...videos.values()],
    cookies,
    stoppedReason,
    truncated: queue.length > 0,
  };
}

/**
 * Download a single asset via the stealth proxy (routed per `routing`).
 * @param {{ url:string, referer?:string, cookies?:string, routing?:object }} params
 */
export async function downloadAsset({ url, referer, cookies, routing = {} }) {
  if (!url) throw new Error('An asset URL is required.');
  await assertPublicUrl(url);
  const proxyUrl = resolveProxyForRequest(routing);
  const ext = extFromUrl(url);
  const isImage = IMAGE_EXT.includes(ext);
  const { response } = await stealthFetch(url, {
    referer,
    cookies,
    isNavigation: false,
    timeoutMs: 60000,
    proxyUrl,
  });
  if (!response.ok) throw new Error(`Download failed with status ${response.status}.`);

  const buf = Buffer.from(await response.arrayBuffer());
  const MAX_BYTES = 75 * 1024 * 1024;
  if (buf.length > MAX_BYTES) throw new Error('Asset exceeds the 75MB download limit — use My-IP (browser) mode for very large files.');

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
 * Fetch images via the stealth proxy and return base64 for the OCR pipeline.
 * @param {{ urls:string[], referer?:string, cookies?:string, routing?:object }} params
 */
export async function fetchImagesForOcr({ urls, referer, cookies, routing = {} }) {
  const list = (Array.isArray(urls) ? urls : []).slice(0, 100);
  if (!list.length) throw new Error('No image URLs provided.');
  const images = [];
  const failed = [];
  for (const url of list) {
    try {
      const asset = await downloadAsset({ url, referer, cookies, routing });
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
