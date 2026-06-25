import { getFirecrawlApiKey } from './ai';

import { appendRegionalSuffix } from '../osint/regionalQuery';

export type CompanySearchOptions = {
  companyName: string;
  location?: string;
  radiusMiles?: number;
};

function buildSearchQuery(opts: CompanySearchOptions): string {
  const base = `${opts.companyName} leadership hiring manager recruiter HR director contact email phone`;
  if (!opts.location?.trim()) return base;
  return appendRegionalSuffix(base, {
    restrictToRegion: true,
    location: opts.location,
    radiusMiles: opts.radiusMiles,
  });
}

export async function scrapeJobPosting(jobUrl: string): Promise<string | null> {
  const firecrawlKey = await getFirecrawlApiKey();
  if (!firecrawlKey || !jobUrl.trim()) return null;

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: jobUrl.trim(),
        formats: ['markdown'],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown;
    if (typeof markdown === 'string' && markdown.trim()) {
      return markdown.substring(0, 12000);
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchCompanyIntel(opts: CompanySearchOptions): Promise<string> {
  const firecrawlKey = await getFirecrawlApiKey();
  const companyName = opts.companyName?.trim();
  if (!firecrawlKey || !companyName) return '';

  const query = buildSearchQuery(opts);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        query,
        limit: 8,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) return '';
    const searchData = await response.json();
    if (!Array.isArray(searchData.data)) return '';

    return searchData.data
      .map((item: { markdown?: string; description?: string; title?: string }) =>
        item.markdown || item.description || item.title || ''
      )
      .join('\n\n')
      .substring(0, 12000);
  } catch {
    return '';
  }
}

/** Backward-compatible wrapper */
export async function searchCompanyIntelByName(companyName: string): Promise<string> {
  return searchCompanyIntel({ companyName, radiusMiles: 50 });
}
