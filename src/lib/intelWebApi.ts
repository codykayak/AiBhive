import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type IntelTargetType = 'company' | 'domain' | 'person';

export type CloudToolId = 'firecrawl_search' | 'firecrawl_scrape' | 'serp_search';

export type ChatTurn = { role: 'user' | 'ai'; content: string };

export type ToolRunResult = {
  toolId: CloudToolId;
  status: 'done' | 'error' | 'skipped';
  summary?: string;
  data?: string;
  error?: string;
  chargedUsd?: number;
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
  enabledTools: CloudToolId[];
  toolResults: ToolRunResult[];
  brief?: string;
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

export type CloudToolsMeta = {
  tools: CloudToolId[];
  costsUsd: Record<string, number>;
};

export async function fetchHivePlans(): Promise<HivePlansResponse | null> {
  try {
    const res = await fetch('/api/hive/plans');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCloudToolsMeta(): Promise<CloudToolsMeta | null> {
  try {
    const res = await fetch('/api/intel-gathering/cloud-tools');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function runCloudTool(
  toolId: CloudToolId,
  params: Record<string, string | number | boolean | undefined>
): Promise<ToolRunResult> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/intel-gathering/cloud-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, toolId, params }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `Need Hive credits (~$${(data.amountUsd ?? 0.03).toFixed(2)}). Starter plan is $5 — same pricing as the mobile app.`
    );
  }
  if (!res.ok || !data.ok) {
    return {
      toolId,
      status: 'error',
      error: data.error || 'Cloud tool failed',
    };
  }
  return {
    toolId,
    status: 'done',
    summary: data.summary,
    data: data.data,
    chargedUsd: data.chargedUsd,
  };
}

export async function sendIntelChat(opts: {
  message: string;
  history?: ChatTurn[];
  targetContext?: string;
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
    }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `Need Hive credits (~$${(data.amountUsd ?? 0.02).toFixed(2)}). Same 30% markup as the AiBhive app.`
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
  const trimmed = label.trim();
  if (targetType === 'domain') {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return '';
}

export function buildDorkUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export const CLOUD_TOOLS: {
  id: CloudToolId;
  name: string;
  description: string;
  defaultOn: boolean;
}[] = [
  {
    id: 'firecrawl_search',
    name: 'Deep web search',
    description: 'Firecrawl — news, leadership, filings (Hive Cloud)',
    defaultOn: true,
  },
  {
    id: 'serp_search',
    name: 'Quick factual search',
    description: 'SerpAPI — fast public results (Hive Cloud)',
    defaultOn: true,
  },
  {
    id: 'firecrawl_scrape',
    name: 'Site scrape',
    description: 'Full page markdown when domain/URL is known',
    defaultOn: false,
  },
];

export const TARGET_TYPES: {
  id: IntelTargetType;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    id: 'company',
    label: 'Company',
    hint: 'Business name — we find their site & leadership',
    placeholder: 'Acme Corporation',
  },
  {
    id: 'domain',
    label: 'Website',
    hint: 'Domain or URL — site content & infrastructure',
    placeholder: 'example.com',
  },
  {
    id: 'person',
    label: 'Person',
    hint: 'Full name — social, LinkedIn dorks, public records',
    placeholder: 'Jane Smith',
  },
];

export const DEFAULT_INTENT =
  'I want to know everything there is to know about this target — leadership, tech stack, public contacts, infrastructure, and reputation.';
