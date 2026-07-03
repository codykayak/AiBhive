import { authHeaders, getOrCreateHiveUserId } from './hiveApi';

const HIVE_API_BASE = 'https://aibhive.com';

export type CloudToolResult = {
  summary: string;
  data: string;
  costUsd?: number;
};

export type CloudToolResponse =
  | { ok: true; summary: string; data: string; costUsd?: number; chargedUsd?: number }
  | { ok: false; needPayment?: boolean; amountUsd?: number; error?: string };

export type IntelCloudKeyStatus = {
  firecrawl: boolean;
  serpapi: boolean;
  discoveryReady: boolean;
  envVarNames: { firecrawl: string; serpapi: string };
  setupHint: string | null;
};

export async function fetchIntelCloudStatus(): Promise<IntelCloudKeyStatus | null> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/intel-gathering/cloud-status`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function runIntelCloudTool(
  toolId: string,
  params: Record<string, string>
): Promise<CloudToolResponse> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(`${HIVE_API_BASE}/api/intel-gathering/cloud-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, toolId, params }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd };
    }
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Cloud tool failed (${res.status})` };
    }
    if (!data.ok && data.error) {
      return { ok: false, error: data.error };
    }
    return {
      ok: true,
      summary: data.summary,
      data: data.data,
      costUsd: data.costUsd,
      chargedUsd: data.chargedUsd,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Hive Cloud unavailable' };
  }
}

export async function synthesizeIntelViaServer(opts: {
  target: {
    type: string;
    label: string;
    domain?: string;
    userIntent?: string;
    region?: { location: string; radiusMiles: number };
  };
  toolResults: Array<{
    toolId: string;
    status: string;
    summary?: string;
    data?: string;
    error?: string;
  }>;
  userIntent?: string;
}): Promise<{ ok: true; text: string } | { ok: false; needPayment?: boolean; amountUsd?: number; error: string }> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(`${HIVE_API_BASE}/api/intel-gathering/synthesize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        target: opts.target,
        toolResults: opts.toolResults,
        userIntent: opts.userIntent || opts.target.userIntent,
      }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return {
        ok: false,
        needPayment: true,
        amountUsd: data.amountUsd,
        error: data.error || `Need Hive credits (~$${(data.amountUsd ?? 0.02).toFixed(2)})`,
      };
    }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Intel synthesis failed' };
    }
    return { ok: true, text: data.text || data.brief || '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Intel synthesis unavailable' };
  }
}

export async function fetchCloudToolCosts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/intel-gathering/cloud-tools`);
    if (!res.ok) return {};
    const json = await res.json();
    return json.costsUsd ?? {};
  } catch {
    return {};
  }
}
