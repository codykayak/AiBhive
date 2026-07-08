/**
 * Default data source catalog — users can enable/disable or add custom sources.
 * Each entry maps to an ingestion adapter in functions/lib/tartar/ingestion/.
 */

/** @type {import('./schema.js').TartarSource[]} */
export const DEFAULT_SOURCES = [
  {
    id: 'internet_archive',
    name: 'Internet Archive',
    kind: 'internet_archive',
    description: 'archive.org — books, maps, texts. Search "Tartaria", "Tartary", or specific old map titles.',
    homepageUrl: 'https://archive.org',
    searchUrlTemplate: 'https://archive.org/search?query={query}',
    enabled: true,
    isCustom: false,
    defaultSearchTerms: ['Tartaria', 'Tartary', 'Tartar', 'Grand Tartaria'],
    adapterConfig: {
      collections: ['texts', 'image', 'maps'],
      maxResultsPerQuery: 50,
    },
  },
  {
    id: 'david_rumsey',
    name: 'David Rumsey Map Collection',
    kind: 'david_rumsey',
    description: 'High-resolution historical maps at davidrumsey.com and via Internet Archive mirror.',
    homepageUrl: 'https://www.davidrumsey.com',
    searchUrlTemplate: 'https://www.davidrumsey.com/blog/search/?q={query}',
    enabled: true,
    isCustom: false,
    defaultSearchTerms: ['Tartary', 'Tartaria', 'Asia'],
    adapterConfig: { useArchiveMirror: true },
  },
  {
    id: 'loc_maps',
    name: 'Library of Congress — Maps',
    kind: 'loc_maps',
    description: 'loc.gov map collections, especially 18th–early 20th century cartography.',
    homepageUrl: 'https://www.loc.gov/maps/',
    searchUrlTemplate: 'https://www.loc.gov/search/?in=original-format:map&q={query}',
    enabled: true,
    isCustom: false,
    defaultSearchTerms: ['Tartary', 'Tartaria', 'Russian Asia'],
    adapterConfig: { format: 'map' },
  },
  {
    id: 'chronicling_america',
    name: 'Chronicling America',
    kind: 'chronicling_america',
    description: 'Historic U.S. newspapers — builder, architect, and author mentions.',
    homepageUrl: 'https://chroniclingamerica.loc.gov',
    searchUrlTemplate: 'https://chroniclingamerica.loc.gov/search/pages/results/?proxtext={query}',
    enabled: true,
    isCustom: false,
    defaultSearchTerms: ['architect', 'builder', 'Tartary'],
    adapterConfig: { dateStart: '1789', dateEnd: '1963' },
  },
  {
    id: 'google_books',
    name: 'Google Books',
    kind: 'google_books',
    description: '18th and 19th century geography and history books (public domain).',
    homepageUrl: 'https://books.google.com',
    searchUrlTemplate: 'https://www.google.com/search?tbm=bks&q={query}',
    enabled: true,
    isCustom: false,
    defaultSearchTerms: ['Tartary geography', 'Tartaria history'],
    adapterConfig: { publicDomainOnly: true },
  },
  {
    id: 'reddit_tartaria',
    name: 'Reddit — r/Tartaria & r/CulturalLayer',
    kind: 'reddit',
    description: 'Community-compiled evidence and discussion threads.',
    homepageUrl: 'https://www.reddit.com/r/Tartaria/',
    searchUrlTemplate: 'https://www.reddit.com/r/{subreddit}/search/?q={query}',
    enabled: false,
    isCustom: false,
    defaultSearchTerms: ['builder', 'architect', 'impossible'],
    adapterConfig: {
      subreddits: ['Tartaria', 'CulturalLayer'],
      respectRateLimit: true,
    },
  },
  {
    id: 'stolen_history',
    name: 'StolenHistory.net',
    kind: 'stolen_history',
    description: 'Forum archive — one of the main hubs where the theory developed.',
    homepageUrl: 'https://stolenhistory.net',
    enabled: false,
    isCustom: false,
    defaultSearchTerms: ['Tartaria', 'builder', 'architect'],
    adapterConfig: { crawlRespectfully: true },
  },
];

export function getSourceById(id) {
  return DEFAULT_SOURCES.find((s) => s.id === id) ?? null;
}

export function buildSearchUrl(source, query) {
  const template = source.searchUrlTemplate;
  if (!template) return source.homepageUrl ?? '#';
  return template.replace('{query}', encodeURIComponent(query));
}
