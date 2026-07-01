/**
 * Discovery-mode search query builder — runs real web searches via SerpAPI/Firecrawl.
 */
import { buildDorkPack } from './intelDorks.js';

function mentionsFlorida(text) {
  return /\b(florida|\bfl\b|sunbiz|orlando|miami|tampa|jacksonville|fort lauderdale)\b/i.test(text);
}

function locationFromIntent(text) {
  const trimmed = String(text || '').trim();
  const cityState = trimmed.match(
    /\b(in|near|around)\s+([A-Za-z][A-Za-z\s.'-]{1,40}?),\s*(Florida|FL)\b/i
  );
  if (cityState) return `${cityState[2].trim()}, ${cityState[3]}`;
  const stateOnly = trimmed.match(/\b(Florida|FL)\b/i);
  if (stateOnly) return 'Florida';
  const cityOnly = trimmed.match(
    /\b(in|near|around)\s+(Orlando|Miami|Tampa|Jacksonville|Fort Lauderdale)\b/i
  );
  if (cityOnly) return cityOnly[2];
  return '';
}

/** Build up to 5 distinct search queries for list/discovery investigations. */
export function buildDiscoverySearchQueries(params) {
  const userIntent = String(params.userIntent || params.company || params.label || '').trim();
  const location =
    String(params.region?.location || params.location || '').trim() ||
    locationFromIntent(userIntent);
  const combined = `${userIntent} ${location}`.trim();

  const queries = new Set();
  if (userIntent) queries.add(userIntent);

  const pack = buildDorkPack({
    targetType: 'discovery',
    query: userIntent,
    userIntent,
    company: userIntent,
    region: location ? { location, restrictToRegion: true } : params.region,
  });
  for (const d of pack) queries.add(d.query);

  if (mentionsFlorida(combined)) {
    const loc = location || 'Florida';
    queries.add(`site:sunbiz.org dissolved inactive construction contractor ${loc}`);
    queries.add(`site:sunbiz.org "administratively dissolved" ${loc} construction`);
    queries.add(`${loc} construction contractor "out of business" OR dissolved OR inactive 2023 2024`);
    queries.add(`site:myfloridalicense.com void inactive contractor ${loc}`);
  }

  return [...queries].filter((q) => q.length > 8).slice(0, 5);
}
