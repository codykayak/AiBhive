/**
 * Normalize and validate http(s) URLs for Fable Scrape / Research Lab.
 * Shared logic so client and server reject the same bad inputs with clear errors.
 */

/** Strip zero-width / BOM / curly quotes and surrounding wrappers from pasted URLs. */
export function sanitizeUrlInput(raw) {
  let s = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u00A0\u2028\u2029]/g, ' ')
    .trim();

  // Strip wrapping quotes / angle brackets / markdown link wrappers
  s = s.replace(/^['"`“”‘’]+/, '').replace(/['"`“”‘’]+$/, '').trim();
  s = s.replace(/^<+/, '').replace(/>+$/, '').trim();

  // If the user pasted a markdown link [label](https://...), keep the href
  const md = s.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (md) s = md[1];

  // If they pasted a sentence containing a URL, extract the first http(s) URL
  if (!/^https?:\/\//i.test(s)) {
    const embedded = s.match(/https?:\/\/[^\s<>"']+/i);
    if (embedded) s = embedded[0].replace(/[),.;:]+$/, '');
  }

  // Collapse internal whitespace (common when pasting from PDFs)
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Turn user input into a canonical http(s) URL string, or '' if empty.
 * Does not throw — callers should validate with parseHttpUrl / assertPublicUrl.
 */
export function normalizeHttpUrlInput(raw) {
  let s = sanitizeUrlInput(raw);
  if (!s) return '';

  // Bare domains / paths → https
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    s = `https://${s}`;
  }

  // Encode spaces in path/query (URL ctor accepts them in some engines but not all)
  if (/\s/.test(s)) {
    try {
      const u = new URL(s);
      // rebuild with encoded pathname segments that still have spaces
      s = u.toString();
    } catch {
      s = s.replace(/ /g, '%20');
    }
  }

  return s;
}

/**
 * Parse a user-supplied URL into a WHATWG URL, or throw a clear Error.
 * @returns {URL}
 */
export function parseHttpUrl(raw) {
  const normalized = normalizeHttpUrlInput(raw);
  if (!normalized) {
    throw new Error('Enter an archive URL (e.g. https://archive.org/details/…).');
  }

  // Incomplete scheme-only values after normalize
  if (/^https?:\/\/$/i.test(normalized) || /^https?:\/\/\/+$/i.test(normalized)) {
    throw new Error(
      'That looks incomplete — enter a full address like https://archive.org/details/your-collection',
    );
  }

  let parsed;
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

  return parsed;
}
