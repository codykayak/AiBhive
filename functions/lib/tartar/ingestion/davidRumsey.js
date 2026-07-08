import { internetArchiveAdapter } from './internetArchive.js';

/**
 * David Rumsey maps — uses Internet Archive mirror when configured.
 */
async function searchDavidRumsey(source, searchTerms, opts = {}) {
  if (source.adapterConfig?.useArchiveMirror !== false) {
    const iaSource = {
      ...source,
      kind: 'internet_archive',
      adapterConfig: {
        ...source.adapterConfig,
        collections: ['maps'],
      },
    };
    const rumseyTerms = searchTerms.map((t) => `creator:"David Rumsey" OR ${t}`);
    const records = await internetArchiveAdapter.search(iaSource, rumseyTerms, opts);
    return records.map((r) => ({
      ...r,
      metadata: { ...r.metadata, sourceKind: 'david_rumsey' },
    }));
  }
  return searchTerms.map((term) => ({
    id: `rumsey-${term}`,
    title: `David Rumsey search: ${term}`,
    url: `https://www.davidrumsey.com/blog/search/?q=${encodeURIComponent(term)}`,
    text: term,
    metadata: { sourceKind: 'david_rumsey', searchTerm: term, manualReview: true },
  }));
}

export const davidRumseyAdapter = { kind: 'david_rumsey', search: searchDavidRumsey };
