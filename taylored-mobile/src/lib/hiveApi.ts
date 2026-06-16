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
  prUrl?: string;
  cursorAgentUrl?: string;
};

export async function createHiveTask(message: string, userId: string): Promise<HiveTask> {
  const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Hive request failed');
  return data.task;
}

export async function approveHiveTask(taskId: string): Promise<HiveTask> {
  const res = await fetch(`${HIVE_API_BASE}/api/hive/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function getOrCreateHiveUserId(): Promise<string> {
  const { getItemAsync, setItemAsync } = await import('expo-secure-store');
  let id = await getItemAsync('hive_user_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await setItemAsync('hive_user_id', id);
  }
  return id;
}
