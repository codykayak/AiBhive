/**
 * Client-side URL normalize/validate for Fable Scrape (mirrors server/urlNormalize.js).
 */

export function sanitizeUrlInput(raw: unknown): string {
  let s = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u00A0\u2028\u2029]/g, ' ')
    .trim();

  s = s.replace(/^['"`“”‘’]+/, '').replace(/['"`“”‘’]+$/, '').trim();
  s = s.replace(/^<+/, '').replace(/>+$/, '').trim();

  const md = s.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (md) s = md[1];

  if (!/^https?:\/\//i.test(s)) {
    const embedded = s.match(/https?:\/\/[^\s<>"']+/i);
    if (embedded) s = embedded[0].replace(/[),.;:]+$/, '');
  }

  return s.replace(/\s+/g, ' ').trim();
}

export function normalizeHttpUrlInput(raw: unknown): string {
  let s = sanitizeUrlInput(raw);
  if (!s) return '';

  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    s = `https://${s}`;
  }

  if (/\s/.test(s)) {
    try {
      s = new URL(s).toString();
    } catch {
      s = s.replace(/ /g, '%20');
    }
  }

  return s;
}

/** @returns canonical href, or throws with a user-facing message */
export function parseHttpUrl(raw: unknown): string {
  const normalized = normalizeHttpUrlInput(raw);
  if (!normalized) {
    throw new Error('Enter an archive URL (e.g. https://archive.org/details/…).');
  }

  if (/^https?:\/\/$/i.test(normalized) || /^https?:\/\/\/+$/i.test(normalized)) {
    throw new Error(
      'That looks incomplete — enter a full address like https://archive.org/details/your-collection',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    const preview = normalized.length > 80 ? `${normalized.slice(0, 80)}…` : normalized;
    throw new Error(
      `Invalid URL: “${preview}”. Use a full http(s) address like https://archive.org/…`,
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are supported.');
  }

  if (!parsed.hostname || parsed.hostname === '.') {
    throw new Error(
      'That URL is missing a hostname. Example: https://archive.org/details/your-collection',
    );
  }

  return parsed.toString();
}
