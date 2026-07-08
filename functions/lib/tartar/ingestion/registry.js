import { internetArchiveAdapter } from './internetArchive.js';
import { chroniclingAmericaAdapter } from './chroniclingAmerica.js';
import { locMapsAdapter } from './locMaps.js';
import { davidRumseyAdapter } from './davidRumsey.js';
import { googleBooksAdapter } from './googleBooks.js';
import { redditAdapter } from './reddit.js';
import { stolenHistoryAdapter } from './stolenHistory.js';
import { genericHttpAdapter } from './genericHttp.js';

const ADAPTERS = {
  internet_archive: internetArchiveAdapter,
  chronicling_america: chroniclingAmericaAdapter,
  loc_maps: locMapsAdapter,
  david_rumsey: davidRumseyAdapter,
  google_books: googleBooksAdapter,
  reddit: redditAdapter,
  stolen_history: stolenHistoryAdapter,
  custom_http: genericHttpAdapter,
};

export function getAdapter(kind) {
  return ADAPTERS[kind] ?? null;
}

export function listAdapterKinds() {
  return Object.keys(ADAPTERS);
}

/**
 * Run ingestion for one source config + search terms.
 */
export async function ingestFromSource(source, searchTerms, opts = {}) {
  const adapter = getAdapter(source.kind);
  if (!adapter) {
    throw new Error(`No ingestion adapter for kind: ${source.kind}`);
  }
  const terms = searchTerms?.length ? searchTerms : (source.defaultSearchTerms ?? []);
  return adapter.search(source, terms, opts);
}

export { ADAPTERS };
