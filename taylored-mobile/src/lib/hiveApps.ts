import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HiveTask } from './hiveApi';

const STORAGE_KEY = 'hive_my_apps_v1';

export type HiveAppRecord = {
  id: string;
  title: string;
  summary: string;
  status: 'building' | 'complete' | 'failed';
  createdAt: string;
  updatedAt: string;
  taskId?: string;
  prUrl?: string;
  prompt?: string;
};

function titleFromTask(task: HiveTask, fallback: string): string {
  const raw = task.summary || task.message || fallback;
  const trimmed = raw.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45)}…`;
}

export async function listHiveApps(): Promise<HiveAppRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HiveAppRecord[];
    return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

async function saveAll(apps: HiveAppRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export async function upsertHiveAppFromTask(task: HiveTask, prompt?: string): Promise<HiveAppRecord> {
  const apps = await listHiveApps();
  const now = new Date().toISOString();
  const existingIdx = apps.findIndex((a) => a.taskId === task.id || a.id === task.id);
  const status =
    task.status === 'complete' ? 'complete' : task.status === 'failed' ? 'failed' : 'building';

  const record: HiveAppRecord = {
    id: existingIdx >= 0 ? apps[existingIdx].id : task.id,
    title: titleFromTask(task, 'New Hive app'),
    summary: task.summary || task.reply || 'Building in the cloud…',
    status,
    createdAt: existingIdx >= 0 ? apps[existingIdx].createdAt : now,
    updatedAt: now,
    taskId: task.id,
    prUrl: task.prUrl,
    prompt: prompt ?? task.message,
  };

  if (existingIdx >= 0) apps[existingIdx] = record;
  else apps.unshift(record);

  await saveAll(apps.slice(0, 40));
  return record;
}

export async function countBuildingApps(): Promise<number> {
  const apps = await listHiveApps();
  return apps.filter((a) => a.status === 'building').length;
}
