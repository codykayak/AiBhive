/**
 * Firecrawl search/scrape helpers for Intel Agent.
 */

function pickResults(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.web)) return json.data.web;
  if (Array.isArray(json?.web)) return json.web;
  return [];
}

function formatSearchItem(item, index) {
  const title = item.title || item.metadata?.title || 'Result';
  const url = item.url || item.metadata?.sourceURL || item.link || 'n/a';
  const body = item.markdown || item.description || item.metadata?.description || item.snippet || '';
  return `[${index + 1}] ${title}\nURL: ${url}\n${String(body).slice(0, 2500)}`;
}

async function readFirecrawlError(res) {
  try {
    const json = await res.json();
    if (json?.error) return String(json.error);
    if (json?.message) return String(json.message);
    return JSON.stringify(json).slice(0, 300);
  } catch {
    return res.statusText || 'Unknown Firecrawl error';
  }
}

/**
 * Lightweight web search — SERP metadata only (no per-result scrape) for speed/reliability.
 */
export async function firecrawlWebSearch(apiKey, query, opts = {}) {
  const body = {
    query,
    limit: opts.limit ?? 10,
    timeout: opts.timeout ?? 45000,
  };
  const location = String(opts.location || '').trim();
  if (location) body.location = location;
  if (opts.country) body.country = opts.country;

  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await readFirecrawlError(res);
    throw new Error(`Firecrawl search failed (${res.status}): ${detail}`);
  }

  const json = await res.json();
  if (json?.success === false) {
    throw new Error(`Firecrawl search error: ${json.error || json.message || 'unknown'}`);
  }

  const results = pickResults(json);
  const lines = results.map((item, i) => formatSearchItem(item, i));
  return {
    summary: `${lines.length} Firecrawl search results (Hive Cloud)`,
    data: lines.join('\n\n') || 'No search results returned.',
    count: lines.length,
  };
}

export async function firecrawlScrapePage(apiKey, url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });

  if (!res.ok) {
    const detail = await readFirecrawlError(res);
    throw new Error(`Firecrawl scrape failed (${res.status}): ${detail}`);
  }

  const json = await res.json();
  if (json?.success === false) {
    throw new Error(`Firecrawl scrape error: ${json.error || json.message || 'unknown'}`);
  }

  const md = json?.data?.markdown ?? json?.markdown ?? '';
  return {
    summary: 'Page scraped via Firecrawl (Hive Cloud)',
    data: String(md).slice(0, 14000),
  };
}
