import type { IntelRegionFilter, IntelTargetType } from './types';

export const REGION_RADIUS_OPTIONS = [30, 50, 75, 100] as const;

export function normalizeRadiusMiles(value?: number | string | null): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : value ?? 50;
  return Math.min(100, Math.max(30, Number.isFinite(n) ? n : 50));
}

/** Append city/region constraint to a web search query. */
export function appendRegionalSuffix(baseQuery: string, region?: IntelRegionFilter): string {
  const q = baseQuery.trim();
  if (!region?.restrictToRegion || !region.location?.trim()) return q;
  const miles = normalizeRadiusMiles(region.radiusMiles);
  return `${q} near ${region.location.trim()} within ${miles} miles local regional`;
}

export type IntelSearchQueryOpts = {
  targetType: IntelTargetType;
  label: string;
  domain?: string;
  userIntent?: string;
  region?: IntelRegionFilter;
};

/** Build Firecrawl/Serp search queries tuned to company, website, or person targets. */
export function buildIntelSearchQuery(opts: IntelSearchQueryOpts): string {
  const { targetType, label, domain, userIntent, region } = opts;
  const intent = userIntent?.trim();
  let base = '';

  if (targetType === 'person') {
    base = intent
      ? `"${label}" ${intent} LinkedIn profile biography public records`
      : `"${label}" LinkedIn profile social media public biography contact`;
  } else if (targetType === 'domain') {
    const site = domain || label;
    base = intent
      ? `${site} ${intent} company about leadership technology`
      : `${site} company about leadership technology infrastructure contact`;
  } else {
    base = intent
      ? `"${label}" ${intent} leadership hiring news`
      : `"${label}" company leadership technology news contact email`;
  }

  return appendRegionalSuffix(base, region);
}

export function formatRegionLabel(region?: IntelRegionFilter): string | null {
  if (!region?.restrictToRegion || !region.location?.trim()) return null;
  return `${region.location.trim()} (${normalizeRadiusMiles(region.radiusMiles)} mi)`;
}
