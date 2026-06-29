import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type IntelTargetType = 'company' | 'domain' | 'person' | 'discovery';

export type IntelChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
};

export type UploadedResearchDoc = {
  id: string;
  name: string;
  chars: number;
  text: string;
  uploadedAt: string;
};

export type FreeToolId =
  | 'dns_records'
  | 'mx_records'
  | 'txt_records'
  | 'cert_transparency'
  | 'subdomain_probe'
  | 'rdap_domain'
  | 'tech_fingerprint'
  | 'security_headers'
  | 'page_extract'
  | 'email_harvest'
  | 'robots_sitemap'
  | 'google_dorks'
  | 'username_probe'
  | 'wayback_snapshot';

export type CloudToolId = 'firecrawl_search' | 'firecrawl_scrape' | 'serp_search';

export type OsintToolId = FreeToolId | CloudToolId;

export type ChatTurn = { role: 'user' | 'ai'; content: string };

export type ToolRunResult = {
  toolId: string;
  status: 'done' | 'error' | 'skipped';
  summary?: string;
  data?: string;
  error?: string;
  chargedUsd?: number;
  tier?: 'free' | 'cloud';
};

export type IntelWebCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'running' | 'complete' | 'error';
  target: {
    type: IntelTargetType;
    label: string;
    domain?: string;
    userIntent?: string;
    region?: { location: string; radiusMiles: number };
  };
  enabledTools: OsintToolId[];
  toolResults: ToolRunResult[];
  brief?: string;
  chatMessages?: IntelChatMessage[];
  uploadedDocuments?: UploadedResearchDoc[];
  error?: string;
};

export type HivePlansResponse = {
  plans: Array<{
    id: string;
    name: string;
    priceUsd: number;
    interval: string | null;
    tagline: string;
    highlights: string[];
  }>;
  tokenMarkup: number;
  currencyName: string;
  freeFeatures: string[];
};

export const WEB_OSINT_TOOLS: {
  id: OsintToolId;
  name: string;
  description: string;
  tier: 'free' | 'cloud';
  defaultOn: boolean;
  targets: IntelTargetType[];
  needsDomain?: boolean;
}[] = [
  { id: 'dns_records', name: 'DNS Records', description: 'A, AAAA, NS lookups', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'mx_records', name: 'Mail (MX)', description: 'Mail server records', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'txt_records', name: 'TXT / SPF', description: 'SPF, DKIM, verification tokens', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'cert_transparency', name: 'Certificate Transparency', description: 'Subdomains via crt.sh', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'subdomain_probe', name: 'Subdomain Probe', description: 'Common subdomain DNS check', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'rdap_domain', name: 'Domain Registration', description: 'RDAP registrar data', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'tech_fingerprint', name: 'Tech Stack', description: 'CMS, analytics, CDN fingerprints', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'security_headers', name: 'Security Headers', description: 'HSTS, CSP, X-Frame-Options', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'page_extract', name: 'Page Extract', description: 'Homepage readable text', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'email_harvest', name: 'Email Harvest', description: 'Emails on public homepage', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'robots_sitemap', name: 'Robots & Sitemap', description: 'robots.txt and sitemap.xml', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'wayback_snapshot', name: 'Wayback Machine', description: 'Internet Archive snapshot', tier: 'free', defaultOn: true, targets: ['company', 'domain'], needsDomain: true },
  { id: 'google_dorks', name: 'Google Dork Pack', description: 'Curated queries — open in browser', tier: 'free', defaultOn: true, targets: ['company', 'domain', 'person', 'discovery'] },
  { id: 'username_probe', name: 'Username Probe', description: 'GitHub, Reddit, Medium, etc.', tier: 'free', defaultOn: true, targets: ['person'] },
  { id: 'firecrawl_search', name: 'Deep web search', description: 'Firecrawl (Hive Cloud credits)', tier: 'cloud', defaultOn: true, targets: ['company', 'domain', 'person', 'discovery'] },
  { id: 'serp_search', name: 'Quick factual search', description: 'SerpAPI (Hive Cloud credits)', tier: 'cloud', defaultOn: true, targets: ['company', 'domain', 'person', 'discovery'] },
  { id: 'firecrawl_scrape', name: 'Site scrape', description: 'Full page markdown (needs domain)', tier: 'cloud', defaultOn: false, targets: ['company', 'domain'], needsDomain: true },
];

export function defaultToolsForTargetType(targetType: IntelTargetType): OsintToolId[] {
  if (targetType === 'discovery') {
    return ['google_dorks', 'firecrawl_search', 'serp_search'];
  }
  return WEB_OSINT_TOOLS.filter((t) => t.defaultOn && t.targets.includes(targetType)).map((t) => t.id);
}

const DISCOVERY_RE =
  /\b(find|list|search for|companies|businesses|defunct|closed|bankrupt|out of business|shut down|inactive|dissolved|ceased operations|no longer operating|went out of business|liquidat)\b/i;

export function isDiscoveryQuery(label: string, userIntent = ''): boolean {
  const combined = `${label} ${userIntent}`.trim();
  if (!combined) return false;
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(label.trim())) return false;
  return DISCOVERY_RE.test(combined) || /\b(more than|at least|over)\s+\d+\s+(year|month)/i.test(combined);
}

export function inferIntelTargetType(label: string, userIntent = ''): IntelTargetType {
  const trimmed = label.trim();
  if (!trimmed && userIntent.trim()) {
    return isDiscoveryQuery('', userIntent) ? 'discovery' : 'company';
  }
  if (isDiscoveryQuery(trimmed, userIntent)) return 'discovery';
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) return 'domain';
  if (/linkedin\.com\/in\//i.test(trimmed) || /^@[a-z0-9._-]+$/i.test(trimmed)) return 'person';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4 && !/\b(inc|llc|ltd|corp|company|group|holdings)\b/i.test(trimmed)) {
    return 'person';
  }
  return 'company';
}

export function isCloudTool(id: OsintToolId): id is CloudToolId {
  return id === 'firecrawl_search' || id === 'firecrawl_scrape' || id === 'serp_search';
}

export async function fetchHivePlans(): Promise<HivePlansResponse | null> {
  try {
    const res = await fetch('/api/hive/plans');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCloudToolsMeta(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/intel-gathering/cloud-tools');
    if (!res.ok) return {};
    const json = await res.json();
    return json.costsUsd ?? {};
  } catch {
    return {};
  }
}

function buildParams(
  targetType: IntelTargetType,
  label: string,
  domain: string,
  userIntent: string,
  region?: { location: string; radiusMiles: number }
) {
  return {
    targetType,
    company: label,
    label,
    domain,
    userIntent,
    restrictToRegion: !!region,
    location: region?.location ?? '',
    radiusMiles: region?.radiusMiles ?? 50,
  };
}

export async function runFreeToolsBatch(
  toolIds: FreeToolId[],
  opts: {
    targetType: IntelTargetType;
    label: string;
    domain: string;
    userIntent: string;
    region?: { location: string; radiusMiles: number };
  }
): Promise<ToolRunResult[]> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/intel-gathering/run-free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      toolIds,
      params: buildParams(opts.targetType, opts.label, opts.domain, opts.userIntent, opts.region),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Free OSINT tools failed');
  }
  return (data.results as ToolRunResult[]).map((r) => ({ ...r, tier: 'free' as const }));
}

export async function runCloudTool(
  toolId: CloudToolId,
  opts: {
    targetType: IntelTargetType;
    label: string;
    domain: string;
    userIntent: string;
    region?: { location: string; radiusMiles: number };
  }
): Promise<ToolRunResult> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/intel-gathering/cloud-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      toolId,
      params: buildParams(opts.targetType, opts.label, opts.domain, opts.userIntent, opts.region),
    }),
  });
  const data = await res.json();
  if (res.status === 402) {
    return {
      toolId,
      status: 'skipped',
      tier: 'cloud',
      error: `Needs Hive credits (~$${(data.amountUsd ?? 0.03).toFixed(2)}) — free tools still ran above`,
    };
  }
  if (!res.ok || !data.ok) {
    return { toolId, status: 'error', tier: 'cloud', error: data.error || 'Cloud tool failed' };
  }
  return {
    toolId,
    status: 'done',
    tier: 'cloud',
    summary: data.summary,
    data: data.data,
    chargedUsd: data.chargedUsd,
  };
}

export async function sendIntelChat(opts: {
  message: string;
  history?: ChatTurn[];
  targetContext?: string;
  documentContext?: string;
}): Promise<{ text: string; provider: string; chargedUsd?: number }> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/intel-gathering/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      message: opts.message,
      history: opts.history || [],
      targetContext: opts.targetContext,
      documentContext: opts.documentContext,
    }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `Need Hive credits (~$${(data.amountUsd ?? 0.02).toFixed(2)}). You still have free tool results above — review them or add credits.`
    );
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Intel chat failed.');
  }
  return {
    text: data.text,
    provider: data.provider || 'hive',
    chargedUsd: data.chargedUsd,
  };
}

export function resolveDomain(label: string, targetType: IntelTargetType): string {
  if (targetType === 'discovery') return '';
  const trimmed = label.trim();
  if (targetType === 'domain') {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (targetType === 'company' && trimmed) {
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    return slug ? `${slug}.com` : '';
  }
  return '';
}

export const DEFAULT_INTENT =
  'I want to know everything there is to know about this target — leadership, tech stack, public contacts, infrastructure, and reputation.';

export function buildDocumentContext(docs: UploadedResearchDoc[]): string {
  if (!docs.length) return '';
  return docs
    .map((d) => `### ${d.name} (${d.chars} chars)\n${d.text.slice(0, 12000)}`)
    .join('\n\n');
}

export async function parseResearchDocument(file: File): Promise<UploadedResearchDoc> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
  const res = await fetch('/api/intel-gathering/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: file.type, base64 }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Document upload failed');
  return {
    id: `doc_${Date.now()}`,
    name: data.name || file.name,
    chars: data.chars || data.text.length,
    text: data.text,
    uploadedAt: new Date().toISOString(),
  };
}

export function buildTargetContext(
  target: IntelWebCase['target'],
  results: ToolRunResult[],
  docs: UploadedResearchDoc[] = []
): string {
  const dump = results
    .filter((r) => r.status === 'done' && (r.data || r.summary))
    .map((r) => `### ${r.toolId}\n${r.summary || ''}\n${r.data?.slice(0, 6000) || ''}`)
    .join('\n\n');
  const docBlock = buildDocumentContext(docs);
  return `Target type: ${target.type}\nLabel: ${target.label}\nDomain: ${target.domain || 'n/a'}\nIntent: ${target.userIntent || ''}\n${
    target.region ? `Region: ${target.region.location} (${target.region.radiusMiles} mi)` : ''
  }\n\nTOOL RESULTS:\n${dump || '(none)'}${
    docBlock ? `\n\nUPLOADED DOCUMENTS:\n${docBlock}` : ''
  }`;
}

/** Markdown brief from tool results when Grok chat is unavailable (no credits / API down). */
export function formatFallbackBrief(
  target: IntelWebCase['target'],
  results: ToolRunResult[]
): string {
  const done = results.filter((r) => r.status === 'done');
  const skipped = results.filter((r) => r.status === 'skipped');
  const errors = results.filter((r) => r.status === 'error');
  const lines = [
    '## Intelligence brief (from OSINT tools)',
    '',
    `**Target:** ${target.label} (${target.type})`,
    target.domain ? `**Domain:** ${target.domain}` : '',
    '',
    '### Key findings',
    '',
  ].filter(Boolean);

  if (done.length) {
    for (const r of done) {
      lines.push(`- **${r.toolId.replace(/_/g, ' ')}**: ${r.summary || 'Completed'}`);
      if (r.data) {
        const snippet = r.data.split('\n').slice(0, 8).join('\n');
        lines.push('', '```', snippet, '```', '');
      }
    }
  } else {
    lines.push('_No successful tool results._', '');
  }

  if (skipped.length) {
    lines.push('### Skipped (needs Hive credits)', '');
    for (const r of skipped) {
      lines.push(`- ${r.toolId}: ${r.error || 'Insufficient credits'}`);
    }
    lines.push('');
  }

  if (errors.length) {
    lines.push('### Errors', '');
    for (const r of errors) {
      lines.push(`- ${r.toolId}: ${r.error || 'Failed'}`);
    }
    lines.push('');
  }

  lines.push(
    '### Recommended next steps',
    '',
    '- Review raw tool output above',
    '- Add Hive credits for deep web search (Firecrawl) or Grok synthesis',
    '- Use Google dork pack links to continue manual research',
  );

  return lines.join('\n');
}

export type FailureToolOffer = {
  ok: boolean;
  reply: string;
  toolkitApp?: { id: string; title: string; tagline?: string; summary?: string; isExample?: boolean } | null;
  offerBuild?: boolean;
  guideSteps?: string[];
};

export async function fetchFailureToolOffer(query: string, reason?: string): Promise<FailureToolOffer | null> {
  const userId = getOrCreateWebHiveUserId();
  try {
    const res = await fetch('/api/hive/orchestrate/failure-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query, reason }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return null;
    return data as FailureToolOffer;
  } catch {
    return null;
  }
}
