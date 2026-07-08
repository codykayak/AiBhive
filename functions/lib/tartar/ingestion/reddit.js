import { createAdapter } from './baseAdapter.js';

/**
 * Reddit — returns search URLs; live API requires OAuth (add adapterConfig credentials).
 */
async function searchReddit(source, searchTerms, opts = {}) {
  const subreddits = source.adapterConfig?.subreddits ?? ['Tartaria', 'CulturalLayer'];
  const records = [];

  for (const sub of subreddits) {
    for (const term of searchTerms) {
      records.push({
        id: `reddit-${sub}-${term}`,
        title: `r/${sub}: ${term}`,
        url: `https://www.reddit.com/r/${sub}/search/?q=${encodeURIComponent(term)}&restrict_sr=1`,
        text: `Community discussion for ${term} in r/${sub}`,
        metadata: { sourceKind: 'reddit', subreddit: sub, searchTerm: term, manualReview: true },
      });
    }
  }
  return records;
}

export const redditAdapter = createAdapter('reddit', searchReddit);
