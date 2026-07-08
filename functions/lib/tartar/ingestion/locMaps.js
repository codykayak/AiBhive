import { createAdapter, fetchJson } from './baseAdapter.js';

async function searchLocMaps(source, searchTerms, opts = {}) {
  const max = opts.maxResults ?? 25;
  const records = [];

  for (const term of searchTerms) {
    const url = `https://www.loc.gov/search/?in=original-format:map&fo=json&c=${max}&q=${encodeURIComponent(term)}`;
    try {
      const data = await fetchJson(url);
      const results = data?.results ?? data?.content?.results ?? [];
      for (const item of results) {
        const rec = item ?? {};
        records.push({
          id: `loc-${rec.id ?? rec.url ?? Math.random()}`,
          title: rec.title ?? 'LOC Map',
          url: rec.url ?? rec.item?.url ?? 'https://www.loc.gov/maps/',
          text: [rec.title, rec.description, rec.subject].flat().filter(Boolean).join('\n'),
          date: rec.dates?.[0] ?? rec.date ?? null,
          metadata: { sourceKind: 'loc_maps', searchTerm: term },
        });
      }
    } catch (err) {
      records.push({
        id: `loc-error-${term}`,
        title: `LOC Maps search: ${term}`,
        url: `https://www.loc.gov/search/?in=original-format:map&q=${encodeURIComponent(term)}`,
        text: '',
        metadata: { error: String(err.message), searchTerm: term },
      });
    }
  }
  return records;
}

export const locMapsAdapter = createAdapter('loc_maps', searchLocMaps);
