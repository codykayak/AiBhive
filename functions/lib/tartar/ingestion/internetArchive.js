import { createAdapter, fetchJson } from './baseAdapter.js';

async function searchInternetArchive(source, searchTerms, opts = {}) {
  const max = source.adapterConfig?.maxResultsPerQuery ?? opts.maxResults ?? 25;
  const records = [];

  for (const term of searchTerms) {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}&fl[]=identifier,title,description,date,creator&rows=${max}&output=json`;
    try {
      const data = await fetchJson(url);
      const docs = data?.response?.docs ?? [];
      for (const doc of docs) {
        records.push({
          id: `ia-${doc.identifier}`,
          title: doc.title ?? doc.identifier,
          url: `https://archive.org/details/${doc.identifier}`,
          text: [doc.title, doc.description, doc.creator].filter(Boolean).join('\n'),
          date: doc.date ?? null,
          author: Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator,
          metadata: { identifier: doc.identifier, sourceKind: 'internet_archive', searchTerm: term },
        });
      }
    } catch (err) {
      records.push({
        id: `ia-error-${term}`,
        title: `Search error: ${term}`,
        url: `https://archive.org/search?query=${encodeURIComponent(term)}`,
        text: '',
        metadata: { error: String(err.message), searchTerm: term },
      });
    }
  }
  return dedupeByUrl(records);
}

export const internetArchiveAdapter = createAdapter('internet_archive', searchInternetArchive);

function dedupeByUrl(records) {
  const seen = new Set();
  return records.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}
