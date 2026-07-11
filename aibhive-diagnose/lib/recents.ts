import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'aibhive.diagnose.recents.v1';

export type RecentDiagnosis = {
  id: string;
  title: string;
  packId: 'pool' | 'electrical' | 'property';
  preview: string;
  createdAt: number;
  faultId?: string;
};

export async function loadRecents(): Promise<RecentDiagnosis[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentDiagnosis[];
  } catch {
    return [];
  }
}

export async function pushRecent(entry: Omit<RecentDiagnosis, 'id' | 'createdAt'>): Promise<void> {
  const current = await loadRecents();
  const next: RecentDiagnosis[] = [
    { ...entry, id: `r-${Date.now()}`, createdAt: Date.now() },
    ...current.filter((r) => r.title !== entry.title),
  ].slice(0, 12);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
