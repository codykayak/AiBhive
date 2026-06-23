/** Hosts we never fetch from the app — avoids Google ToS / CAPTCHA issues. */
const BLOCKED_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'google.co.uk',
  'google.ca',
  'bing.com',
  'www.bing.com',
  'duckduckgo.com',
  'search.yahoo.com',
]);

export function isBlockedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (BLOCKED_HOSTS.has(host)) return true;
    if (host.endsWith('.google.com')) return true;
    return false;
  } catch {
    return true;
  }
}

export function assertSafeUrl(url: string): void {
  if (isBlockedUrl(url)) {
    throw new Error(
      'Direct search engine requests are blocked. Use SerpAPI, Firecrawl, or open dorks in your browser.'
    );
  }
}

const DEFAULT_UA = 'AiBhiveIntelAgent/1.0 (authorized research; +https://aibhive.com)';

export async function safeFetch(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  assertSafeUrl(url);
  const timeoutMs = init?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain,application/json,*/*',
        'User-Agent': DEFAULT_UA,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function safeFetchText(
  url: string,
  timeoutMs = 15000
): Promise<{ text: string; headers: Record<string, string> }> {
  const res = await safeFetch(url, { timeoutMs });
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  const text = await res.text();
  return { text, headers };
}

/** Delay between OSINT modules to avoid hammering targets. */
export function toolDelay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
