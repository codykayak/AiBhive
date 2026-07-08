/**
 * Base adapter contract for archive source ingestion.
 */

/**
 * @typedef {Object} SourceRecord
 * @property {string} id — unique within job
 * @property {string} title
 * @property {string} url
 * @property {string} [text] — extractable body text
 * @property {string} [date]
 * @property {string} [author]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} SourceAdapter
 * @property {string} kind
 * @property {(source: object, searchTerms: string[], opts?: object) => Promise<SourceRecord[]>} search
 */

export function createAdapter(kind, searchFn) {
  return { kind, search };
}

function search(source, searchTerms, opts) {
  return searchFn(source, searchTerms, opts);
}

export async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OldTartarResearch/1.0 (+https://macrorei.com)' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OldTartarResearch/1.0 (+https://macrorei.com)' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}
