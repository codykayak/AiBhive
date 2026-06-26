import { getOrCreateWebHiveUserId } from './hiveWebUser';

export type IntelTargetType = 'company' | 'domain' | 'person';

export type IntelRunPayload = {
  targetType: IntelTargetType;
  label: string;
  domain?: string;
  userIntent?: string;
  restrictToRegion?: boolean;
  location?: string;
  radiusMiles?: number;
  tools?: Array<'firecrawl_search' | 'firecrawl_scrape' | 'serp_search'>;
};

export type IntelRunStep = {
  toolId: string;
  status: 'running' | 'done' | 'failed';
  summary?: string;
  error?: string;
  chargedUsd?: number;
  needPayment?: boolean;
};

export type IntelRunResult = {
  brief: string;
  steps: IntelRunStep[];
  synthesized?: boolean;
  chargedUsd?: number;
};

export async function runIntelResearch(payload: IntelRunPayload): Promise<IntelRunResult> {
  const userId = getOrCreateWebHiveUserId();
  const res = await fetch('/api/hive/intel/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...payload }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.error ||
        `This research run needs Hive credits (~$${(data.amountUsd ?? 0.05).toFixed(2)}). Get the mobile app or add credits.`
    );
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Research run failed.');
  }
  return {
    brief: data.brief,
    steps: data.steps ?? [],
    synthesized: data.synthesized,
    chargedUsd: data.chargedUsd,
  };
}
