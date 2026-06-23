import { getOrCreateHiveUserId } from '../lib/hiveApi';

const HIVE_API_BASE = 'https://aibhive.com';

export type CloudToolResult = {
  summary: string;
  data: string;
  costUsd?: number;
};

export type CloudToolResponse =
  | { ok: true; summary: string; data: string; costUsd?: number }
  | { ok: false; needPayment?: boolean; amountUsd?: number; error?: string };

export async function runIntelCloudTool(
  toolId: string,
  params: Record<string, string>
): Promise<CloudToolResponse> {
  try {
    const userId = await getOrCreateHiveUserId();
    const res = await fetch(`${HIVE_API_BASE}/api/intel-gathering/cloud-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, toolId, params }),
    });
    const data = await res.json();
    if (res.status === 402) {
      return { ok: false, needPayment: true, amountUsd: data.amountUsd };
    }
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Cloud tool failed (${res.status})` };
    }
    return { ok: true, summary: data.summary, data: data.data, costUsd: data.costUsd };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Hive Cloud unavailable' };
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
