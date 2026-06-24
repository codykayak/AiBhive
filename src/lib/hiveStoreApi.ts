import type { HiveAppSpec, PublishedWebApp, StoreCatalog } from './hiveAppTypes';

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchStoreCatalog(params?: {
  q?: string;
  category?: string;
  limit?: number;
}): Promise<StoreCatalog> {
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set('q', params.q.trim());
  if (params?.category?.trim()) sp.set('category', params.category.trim());
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const data = await parseJson<StoreCatalog>(await fetch(`/api/hive/store${qs ? `?${qs}` : ''}`));
  return (
    data || {
      apps: [],
      featured: [],
      webApps: [],
      total: 0,
      totalInstalls: 0,
      categories: {},
      query: null,
      category: null,
    }
  );
}

export async function fetchToolkitApp(appId: string): Promise<HiveAppSpec | null> {
  const data = await parseJson<{ app: HiveAppSpec }>(await fetch(`/api/hive/toolkit/${encodeURIComponent(appId)}`));
  return data?.app || null;
}

export async function fetchWebApps(): Promise<PublishedWebApp[]> {
  const data = await parseJson<{ apps: PublishedWebApp[] }>(await fetch('/api/hive/web-apps'));
  return data?.apps || [];
}

export async function installToolkitApp(
  appId: string,
  userId: string,
  idToken?: string
): Promise<{ app: HiveAppSpec; sourceAppId: string } | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`/api/hive/toolkit/${encodeURIComponent(appId)}/install`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId }),
  });
  const data = await parseJson<{ ok: boolean; app: HiveAppSpec; sourceAppId: string }>(res);
  if (!data?.ok || !data.app) return null;
  return { app: data.app, sourceAppId: data.sourceAppId };
}

export async function createHiveBuildTask(
  message: string,
  userId: string,
  idToken?: string
): Promise<{ taskId: string; reply?: string } | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch('/api/hive/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, userId }),
  });
  const data = await parseJson<{ task?: { id: string; reply?: string } }>(res);
  if (!data?.task?.id) return null;
  return { taskId: data.task.id, reply: data.task.reply };
}
