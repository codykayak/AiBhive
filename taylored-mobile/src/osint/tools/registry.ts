import type { OsintToolDef, OsintToolId } from '../types';

export const OSINT_TOOLS: OsintToolDef[] = [
  {
    id: 'dns_records',
    name: 'DNS Records',
    description: 'A, AAAA, NS lookups for the target domain',
    tier: 'free',
    estSeconds: 3,
    defaultEnabled: true,
  },
  {
    id: 'mx_records',
    name: 'Mail (MX)',
    description: 'Mail server records — validates email infrastructure',
    tier: 'free',
    estSeconds: 2,
    defaultEnabled: true,
  },
  {
    id: 'txt_records',
    name: 'TXT / SPF',
    description: 'SPF, DKIM hints, verification tokens in TXT records',
    tier: 'free',
    estSeconds: 2,
    defaultEnabled: true,
  },
  {
    id: 'cert_transparency',
    name: 'Certificate Transparency',
    description: 'Subdomains discovered via crt.sh cert logs',
    tier: 'free',
    estSeconds: 8,
    defaultEnabled: true,
  },
  {
    id: 'subdomain_probe',
    name: 'Subdomain Probe',
    description: 'Quick DNS check against common subdomain names',
    tier: 'free',
    estSeconds: 15,
    defaultEnabled: true,
  },
  {
    id: 'rdap_domain',
    name: 'Domain Registration (RDAP)',
    description: 'Registrar, dates, and status from public RDAP',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
  },
  {
    id: 'tech_fingerprint',
    name: 'Tech Stack',
    description: 'CMS, analytics, CDN, and framework fingerprints',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
  },
  {
    id: 'security_headers',
    name: 'Security Headers',
    description: 'HSTS, CSP, X-Frame-Options, and related headers',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
  },
  {
    id: 'page_extract',
    name: 'Page Extract',
    description: 'Fetch homepage and extract readable text',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
  },
  {
    id: 'email_harvest',
    name: 'Email Harvest',
    description: 'Emails found on the public homepage (mailto + patterns)',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
  },
  {
    id: 'robots_sitemap',
    name: 'Robots & Sitemap',
    description: 'robots.txt and sitemap.xml discovery',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
  },
  {
    id: 'google_dorks',
    name: 'Google Dork Pack',
    description: 'Curated search operator pack — open in browser or SerpAPI',
    tier: 'free',
    estSeconds: 1,
    defaultEnabled: true,
  },
  {
    id: 'firecrawl_search',
    name: 'Firecrawl Web Search',
    description: 'Deep web search + scrape via Firecrawl API',
    tier: 'api_key',
    apiKeyField: 'firecrawl',
    estSeconds: 20,
    defaultEnabled: true,
  },
  {
    id: 'firecrawl_scrape',
    name: 'Firecrawl Deep Scrape',
    description: 'Full-page markdown extraction via Firecrawl',
    tier: 'api_key',
    apiKeyField: 'firecrawl',
    estSeconds: 12,
    defaultEnabled: true,
  },
  {
    id: 'serp_search',
    name: 'SerpAPI Search',
    description: 'Google/Bing results via SerpAPI (no direct Google scraping)',
    tier: 'api_key',
    apiKeyField: 'serpapi',
    estSeconds: 8,
    defaultEnabled: false,
  },
];

export function getToolDef(id: OsintToolId): OsintToolDef {
  return OSINT_TOOLS.find((t) => t.id === id) ?? OSINT_TOOLS[0];
}

export function defaultEnabledToolIds(): OsintToolId[] {
  return OSINT_TOOLS.filter((t) => t.defaultEnabled).map((t) => t.id);
}

export function toolsRequiringKey(field: 'firecrawl' | 'serpapi'): OsintToolId[] {
  return OSINT_TOOLS.filter((t) => t.apiKeyField === field).map((t) => t.id);
}
