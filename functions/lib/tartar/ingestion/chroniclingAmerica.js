import { createAdapter, fetchJson } from './baseAdapter.js';

async function searchChroniclingAmerica(source, searchTerms, opts = {}) {
  const max = opts.maxResults ?? 25;
  const records = [];
  const dateStart = source.adapterConfig?.dateStart ?? '1789';
  const dateEnd = source.adapterConfig?.dateEnd ?? '1963';

  for (const term of searchTerms) {
    const url = `https://chroniclingamerica.loc.gov/search/pages/results/?andtext=${encodeURIComponent(term)}&dateFilterType=yearRange&date1=${dateStart}&date2=${dateEnd}&format=json&rows=${max}`;
    try {
      const data = await fetchJson(url);
      const items = data?.items ?? [];
      for (const item of items) {
        const page = item.page ?? item;
        records.push({
          id: `ca-${page.id ?? page.url ?? Math.random()}`,
          title: page.title ?? page.newspaper_name ?? 'Newspaper page',
          url: page.url ?? `https://chroniclingamerica.loc.gov${page.href ?? ''}`,
          text: [page.ocr_eng, page.title, page.newspaper_name].filter(Boolean).join('\n'),
          date: page.date ?? null,
          metadata: {
            sourceKind: 'chronicling_america',
            searchTerm: term,
            state: page.state,
            city: page.city,
          },
        });
      }
    } catch (err) {
      records.push({
        id: `ca-error-${term}`,
        title: `Chronicling America search: ${term}`,
        url: `https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=${encodeURIComponent(term)}`,
        text: '',
        metadata: { error: String(err.message), searchTerm: term },
      });
    }
  }
  return records;
}

export const chroniclingAmericaAdapter = createAdapter('chronicling_america', searchChroniclingAmerica);
