import { getFirecrawlApiKey } from './ai';
import { runIntelCloudTool } from './intelCloud';
import { loadUseHiveCloudIntel } from '../osint/preferences';

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

function cloudSearchParams(opts: CompanySearchOptions) {
  const company = opts.companyName.trim();
  const restrictToRegion = opts.location?.trim() ? '1' : '0';
  return {
    company,
    label: company,
    targetType: 'company',
    userIntent: buildSearchQuery(opts),
    location: opts.location?.trim() || '',
    radiusMiles: String(opts.radiusMiles ?? 50),
    restrictToRegion,
  };
}

export async function scrapeJobPosting(jobUrl: string): Promise<string | null> {
  const url = jobUrl.trim();
  if (!url) return null;

  const firecrawlKey = await getFirecrawlApiKey();
  if (firecrawlKey) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const markdown = data?.data?.markdown || data?.markdown;
      if (typeof markdown === 'string' && markdown.trim()) {
        return markdown.substring(0, 12000);
      }
    } catch {
      // fall through to Hive Cloud
    }
  }

  const useHiveCloud = (await loadUseHiveCloudIntel()) || !firecrawlKey;
  if (!useHiveCloud) return null;

  const cloud = await runIntelCloudTool('firecrawl_scrape', { url });
  if (!cloud.ok) return null;
  return (cloud.data || '').substring(0, 12000);
}

export async function searchCompanyIntel(opts: CompanySearchOptions): Promise<string> {
  const companyName = opts.companyName?.trim();
  if (!companyName) return '';

  const firecrawlKey = await getFirecrawlApiKey();
  const query = buildSearchQuery(opts);

  if (firecrawlKey) {
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

      if (response.ok) {
        const searchData = await response.json();
        if (Array.isArray(searchData.data)) {
          return searchData.data
            .map((item: { markdown?: string; description?: string; title?: string }) =>
              item.markdown || item.description || item.title || ''
            )
            .join('\n\n')
            .substring(0, 12000);
        }
      }
    } catch {
      // fall through to Hive Cloud
    }
  }

  const cloud = await runIntelCloudTool('firecrawl_search', cloudSearchParams(opts));
  if (!cloud.ok) {
    if (cloud.needPayment) {
      throw new Error(`Insufficient Hive credits (~$${(cloud.amountUsd ?? 0.03).toFixed(2)})`);
    }
    return '';
  }
  return (cloud.data || '').substring(0, 12000);
}

/** Backward-compatible wrapper */
export async function searchCompanyIntelByName(companyName: string): Promise<string> {
  return searchCompanyIntel({ companyName, radiusMiles: 50 });
}
