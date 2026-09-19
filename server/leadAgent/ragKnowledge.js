/** Cached website text for Grok SMS RAG (three businesses). */

const SITE_BY_BUSINESS = {
  macrorei: ['https://www.macrorei.com/', 'https://www.macrorei.com/llms.txt'],
  manydoors: ['https://manydoorsai.com/', 'https://manydoorsai.com/llms.txt'],
  'aibhive-pros': ['https://aibhive.com/pros', 'https://aibhive.com/llms.txt'],
};

const cache = new Map();
const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CHARS = 12000;

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AiBhive-LeadAgent/1.0 (+https://aibhive.com)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  const raw = await res.text();
  if (ct.includes('html')) return stripHtml(raw);
  return raw.trim();
}

export async function getWebsiteRagContext(businessId) {
  const key = String(businessId || 'macrorei');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.text;

  const urls = SITE_BY_BUSINESS[key] || SITE_BY_BUSINESS.macrorei;
  const parts = [];
  for (const url of urls) {
    try {
      const text = await fetchText(url);
      if (text) parts.push(`--- ${url} ---\n${text.slice(0, MAX_CHARS)}`);
    } catch (e) {
      parts.push(`--- ${url} --- (fetch failed: ${e.message})`);
    }
  }
  const text = parts.join('\n\n').slice(0, MAX_CHARS * 2);
  cache.set(key, { at: Date.now(), text });
  return text;
}

export function clearRagCache(businessId) {
  if (businessId) cache.delete(String(businessId));
  else cache.clear();
}
