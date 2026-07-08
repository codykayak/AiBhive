import { createAdapter } from './baseAdapter.js';

/**
 * Google Books — stub adapter returns search links; full OCR requires API key.
 * Extensible via adapterConfig.apiKey for Google Books API v1.
 */
async function searchGoogleBooks(source, searchTerms, opts = {}) {
  const apiKey = source.adapterConfig?.apiKey ?? opts.googleBooksApiKey;
  const records = [];

  for (const term of searchTerms) {
    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}&maxResults=${opts.maxResults ?? 20}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        for (const item of data.items ?? []) {
          const v = item.volumeInfo ?? {};
          records.push({
            id: `gb-${item.id}`,
            title: v.title ?? 'Book',
            url: v.previewLink ?? v.infoLink ?? `https://books.google.com`,
            text: [v.title, v.subtitle, v.description, ...(v.authors ?? [])].filter(Boolean).join('\n'),
            date: v.publishedDate ?? null,
            author: (v.authors ?? []).join(', '),
            metadata: { sourceKind: 'google_books', searchTerm: term },
          });
        }
        continue;
      } catch {
        // fall through to link stub
      }
    }
    records.push({
      id: `gb-stub-${term}`,
      title: `Google Books search: ${term}`,
      url: `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(term)}`,
      text: term,
      metadata: { sourceKind: 'google_books', searchTerm: term, stub: true },
    });
  }
  return records;
}

export const googleBooksAdapter = createAdapter('google_books', searchGoogleBooks);
