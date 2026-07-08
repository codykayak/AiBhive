import { fetchText } from './baseAdapter.js';

/**
 * Generic HTTP source — user provides base URL and optional CSS selector hints.
 */
async function searchGenericHttp(source, searchTerms) {
  const baseUrl = source.adapterConfig?.baseUrl ?? source.homepageUrl;
  if (!baseUrl) throw new Error('custom_http source requires adapterConfig.baseUrl or homepageUrl');

  const records = [];
  for (const term of searchTerms) {
    const urlTemplate = source.searchUrlTemplate ?? `${baseUrl}?q={query}`;
    const url = urlTemplate.replace('{query}', encodeURIComponent(term));
    try {
      const text = await fetchText(url, { timeoutMs: 15000 });
      records.push({
        id: `custom-${source.id}-${term}`,
        title: `${source.name}: ${term}`,
        url,
        text: text.slice(0, 50000),
        metadata: { sourceKind: 'custom_http', searchTerm: term, sourceId: source.id },
      });
    } catch (err) {
      records.push({
        id: `custom-err-${source.id}-${term}`,
        title: `${source.name}: ${term}`,
        url,
        text: '',
        metadata: { error: String(err.message), searchTerm: term },
      });
    }
  }
  return records;
}

export const genericHttpAdapter = { kind: 'custom_http', search: searchGenericHttp };
