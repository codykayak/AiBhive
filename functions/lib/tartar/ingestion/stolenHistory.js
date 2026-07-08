import { createAdapter } from './baseAdapter.js';

/**
 * StolenHistory.net — forum stub; respectful crawl can be added with adapterConfig.
 */
async function searchStolenHistory(source, searchTerms) {
  return searchTerms.map((term) => ({
    id: `sh-${term}`,
    title: `StolenHistory search: ${term}`,
    url: `https://stolenhistory.net/search/?q=${encodeURIComponent(term)}`,
    text: term,
    metadata: { sourceKind: 'stolen_history', searchTerm: term, manualReview: true },
  }));
}

export const stolenHistoryAdapter = createAdapter('stolen_history', searchStolenHistory);
