import { getFirecrawlApiKey } from './ai';

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

export async function searchCompanyIntel(companyName: string): Promise<string> {
  const firecrawlKey = await getFirecrawlApiKey();
  if (!firecrawlKey || !companyName.trim()) return '';

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        query: `${companyName} leadership hiring manager HR contact`,
        limit: 5,
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
      .substring(0, 8000);
  } catch {
    return '';
  }
}
