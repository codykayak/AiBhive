import type { IntelTargetType, OsintToolDef, OsintToolId } from '../types';

const ALL_TARGETS: IntelTargetType[] = ['company', 'domain', 'person'];
const SITE_TARGETS: IntelTargetType[] = ['company', 'domain'];
const SEARCH_TARGETS: IntelTargetType[] = ['company', 'domain', 'person', 'discovery'];

export const OSINT_TOOLS: OsintToolDef[] = [
  {
    id: 'dns_records',
    name: 'DNS Records',
    description: 'A, AAAA, NS lookups for the target website',
    tier: 'free',
    estSeconds: 3,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'mx_records',
    name: 'Mail (MX)',
    description: 'Mail server records — validates email infrastructure',
    tier: 'free',
    estSeconds: 2,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'txt_records',
    name: 'TXT / SPF',
    description: 'SPF, DKIM hints, verification tokens in TXT records',
    tier: 'free',
    estSeconds: 2,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'cert_transparency',
    name: 'Certificate Transparency',
    description: 'Subdomains discovered via crt.sh cert logs',
    tier: 'free',
    estSeconds: 8,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'subdomain_probe',
    name: 'Subdomain Probe',
    description: 'Quick DNS check against common subdomain names',
    tier: 'free',
    estSeconds: 15,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'rdap_domain',
    name: 'Domain Registration (RDAP)',
    description: 'Registrar, dates, and status from public RDAP',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'tech_fingerprint',
    name: 'Tech Stack',
    description: 'CMS, analytics, CDN, and framework fingerprints',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'security_headers',
    name: 'Security Headers',
    description: 'HSTS, CSP, X-Frame-Options, and related headers',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'page_extract',
    name: 'Page Extract',
    description: 'Fetch homepage and extract readable text',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'email_harvest',
    name: 'Email Harvest',
    description: 'Emails found on the public homepage (mailto + patterns)',
    tier: 'free',
    estSeconds: 6,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'robots_sitemap',
    name: 'Robots & Sitemap',
    description: 'robots.txt and sitemap.xml discovery',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'google_dorks',
    name: 'Google Dork Pack',
    description: 'Curated dork queries — opens in your browser (never scrapes Google)',
    tier: 'free',
    estSeconds: 1,
    defaultEnabled: true,
    applicableTargets: ALL_TARGETS,
  },
  {
    id: 'username_probe',
    name: 'Username Probe',
    description: 'Check GitHub, Reddit, and other platforms for a person handle',
    tier: 'free',
    estSeconds: 20,
    defaultEnabled: true,
    applicableTargets: ['person'],
  },
  {
    id: 'wayback_snapshot',
    name: 'Wayback Machine',
    description: 'Internet Archive snapshots — no search engines involved',
    tier: 'free',
    estSeconds: 4,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'firecrawl_search',
    name: 'Firecrawl Web Search',
    description: 'Deep web search via Firecrawl (BYOK or Hive Cloud credits)',
    tier: 'api_key',
    apiKeyField: 'firecrawl',
    estSeconds: 20,
    defaultEnabled: true,
    applicableTargets: SEARCH_TARGETS,
  },
  {
    id: 'firecrawl_scrape',
    name: 'Firecrawl Deep Scrape',
    description: 'Full-page markdown via Firecrawl (BYOK or Hive Cloud credits)',
    tier: 'api_key',
    apiKeyField: 'firecrawl',
    estSeconds: 12,
    defaultEnabled: true,
    applicableTargets: SITE_TARGETS,
    requiresDomain: true,
  },
  {
    id: 'serp_search',
    name: 'SerpAPI Search',
    description: 'Search results via SerpAPI — never contacts Google from your phone',
    tier: 'api_key',
    apiKeyField: 'serpapi',
    estSeconds: 8,
    defaultEnabled: false,
    applicableTargets: SEARCH_TARGETS,
  },
];

export function getToolDef(id: OsintToolId): OsintToolDef {
  return OSINT_TOOLS.find((t) => t.id === id) ?? OSINT_TOOLS[0];
}

export function defaultEnabledToolIds(): OsintToolId[] {
  return OSINT_TOOLS.filter((t) => t.defaultEnabled).map((t) => t.id);
}

/** Sensible default modules per target mode. */
export function defaultToolsForTargetType(targetType: IntelTargetType): OsintToolId[] {
  if (targetType === 'discovery') {
    return ['google_dorks', 'firecrawl_search', 'serp_search'];
  }
  return OSINT_TOOLS.filter((t) => t.defaultEnabled && t.applicableTargets.includes(targetType)).map(
    (t) => t.id
  );
}

export function toolsForTargetType(targetType: IntelTargetType): OsintToolDef[] {
  return OSINT_TOOLS.filter((t) => t.applicableTargets.includes(targetType));
}

export function toolsRequiringKey(field: 'firecrawl' | 'serpapi'): OsintToolId[] {
  return OSINT_TOOLS.filter((t) => t.apiKeyField === field).map((t) => t.id);
}

export function isToolApplicable(toolId: OsintToolId, targetType: IntelTargetType): boolean {
  const def = getToolDef(toolId);
  return def.applicableTargets.includes(targetType);
}
