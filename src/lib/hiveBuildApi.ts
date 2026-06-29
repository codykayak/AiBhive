import { getOrCreateWebHiveUserId } from './hiveWebUser';
import { getHiveWebAuthHeaders } from './hiveWebAuth';

export type HiveEstimate = { costUsd: number; minutes: number };

export type HiveTask = {
  id: string;
  message: string;
  status: 'clarify' | 'awaiting_approval' | 'building' | 'complete' | 'failed';
  route?: string;
  title?: string;
  appId?: string | null;
  summary?: string;
  estimate?: HiveEstimate | null;
  reply?: string;
  buildPrompt?: string;
  deliverable?: { kind?: string; appId?: string; url?: string; label?: string } | null;
};

export type HiveStatus = {
  online: boolean;
  cursorConfigured: boolean;
  message: string;
};

export async function getHiveStatus(): Promise<HiveStatus | null> {
  try {
    const res = await fetch('/api/hive/status');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createHiveTask(message: string): Promise<HiveTask> {
  const { userId, idToken } = await getHiveWebAuthHeaders();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch('/api/hive/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Build request failed');
  return data.task;
}

export async function getHiveTask(taskId: string): Promise<HiveTask> {
  const res = await fetch(`/api/hive/tasks/${encodeURIComponent(taskId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load build task');
  return data.task;
}

export async function approveHiveTask(taskId: string): Promise<HiveTask> {
  const userId = getOrCreateWebHiveUserId();
  const { idToken } = await getHiveWebAuthHeaders();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`/api/hive/tasks/${encodeURIComponent(taskId)}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (res.status === 402) {
    throw new Error(
      data.checkoutUrl
        ? `Need Hive credits (~$${(data.amountUsd ?? 1).toFixed(2)}). Add credits to continue.`
        : data.error || 'Insufficient credits'
    );
  }
  if (!res.ok) throw new Error(data.error || 'Could not approve build');
  return data.task;
}

export async function fetchHiveAccount(): Promise<{ creditBalanceUsd?: number } | null> {
  try {
    const userId = getOrCreateWebHiveUserId();
    const res = await fetch(`/api/hive/account/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const account = data.account || data;
    return {
      creditBalanceUsd:
        typeof account.creditBalanceUsd === 'number'
          ? account.creditBalanceUsd
          : typeof account.balanceUsd === 'number'
            ? account.balanceUsd
            : undefined,
    };
  } catch {
    return null;
  }
}
