import { auth } from '../firebaseConfig';
import { getOrCreateHiveUserId } from './hiveApi';
import type { HiveAppSpec } from '../dynamicApps/types';

const HIVE_API_BASE = 'https://aibhive.com';

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchUserApps(): Promise<HiveAppSpec[]> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/apps?userId=${encodeURIComponent(userId)}`, {
      headers,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.apps) ? data.apps : [];
  } catch {
    return [];
  }
}

export async function fetchUserApp(appId: string): Promise<HiveAppSpec | null> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(
      `${HIVE_API_BASE}/api/hive/apps/${encodeURIComponent(appId)}?userId=${encodeURIComponent(userId)}`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.app || null;
  } catch {
    return null;
  }
}

export async function deleteUserApp(appId: string): Promise<boolean> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(
      `${HIVE_API_BASE}/api/hive/apps/${encodeURIComponent(appId)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE', headers }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export type ExportTarget = 'web_app' | 'native_app' | 'play_store';

export type ExportTaskResponse = {
  taskId: string;
  estimateUsd: number;
  estimateMinutes: number;
};

export async function requestExport(appId: string, target: ExportTarget): Promise<ExportTaskResponse | null> {
  try {
    const userId = await getOrCreateHiveUserId();
    const headers = await authHeaders();
    const res = await fetch(`${HIVE_API_BASE}/api/hive/apps/${encodeURIComponent(appId)}/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, target }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.task) return null;
    return {
      taskId: data.task.id,
      estimateUsd: data.task.estimate?.costUsd ?? 0,
      estimateMinutes: data.task.estimate?.minutes ?? 0,
    };
  } catch {
    return null;
  }
}
