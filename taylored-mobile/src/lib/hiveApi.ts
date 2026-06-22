import { auth } from '../firebaseConfig';

const HIVE_API_BASE = 'https://aibhive.com';

export type HiveEstimate = {
  costUsd: number;
  minutes: number;
};

export type HiveTask = {
  id: string;
  message: string;
  status: 'clarify' | 'awaiting_approval' | 'building' | 'complete' | 'failed';
  route: 'local' | 'cursor' | 'clarify';
  summary?: string;
  estimate?: HiveEstimate | null;
  reply?: string;
  buildPrompt?: string;
  prUrl?: string;
  cursorAgentUrl?: string;
  source?: 'server' | 'local';
};

export type HiveStatus = {
  online: boolean;
  cursorConfigured: boolean;
  triageModel: string;
  message: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getHiveStatus(): Promise<HiveStatus | null> {
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/hive/status`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function registerHiveUserWithAuth(
  userId: string,
  idToken: string,
  email?: string
): Promise<void> {
  try {
    await fetch(`${HIVE_API_BASE}/api/hive/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ userId, email }),
    });
    const { setItemAsync } = await import('expo-secure-store');
    await setItemAsync('hive_user_id', userId);
  } catch {
    // server may not be deployed yet
  }
}

export async function createHiveTask(
  message: string,
  userId: string,
  attachment?: {
    base64: string;
    mimeType: string;
    width: number;
    height: number;
  }
): Promise<HiveTask> {
  const headers = await authHeaders();
  const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      userId,
      attachmentBase64: attachment?.base64,
      attachmentMime: attachment?.mimeType,
      attachmentWidth: attachment?.width,
      attachmentHeight: attachment?.height,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Hive request failed');
  return data.task;
}

export async function approveHiveTask(taskId: string, userId?: string): Promise<HiveTask> {
  const headers = await authHeaders();
  const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks/${taskId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not approve task');
  return data.task;
}

export async function getHiveTask(taskId: string): Promise<HiveTask> {
  const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks/${taskId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load task');
  return data.task;
}

/** Prefer signed-in Firebase uid; fall back to anonymous device id. */
export async function getOrCreateHiveUserId(): Promise<string> {
  if (auth.currentUser?.uid) return auth.currentUser.uid;

  const { getItemAsync, setItemAsync } = await import('expo-secure-store');
  let id = await getItemAsync('hive_user_id');
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await setItemAsync('hive_user_id', id);
  }
  return id;
}
