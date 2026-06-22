import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local-first data store for each rendered HiveAppSpec page.
 * Key shape: `hive_app_data:<appId>:<pageId>`.
 *
 * Cloud sync (Firestore) is a TODO — local-first keeps the app instantly
 * usable and offline-friendly; we can sync on a timer once we have a
 * conflict policy.
 */

function key(appId: string, pageId: string): string {
  return `hive_app_data:${appId}:${pageId}`;
}

export async function loadPageData<T>(appId: string, pageId: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key(appId, pageId));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function savePageData<T>(appId: string, pageId: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key(appId, pageId), JSON.stringify(value));
  } catch {
    // Storage full / permission — ignore for now.
  }
}

export async function clearAppData(appId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(`hive_app_data:${appId}:`));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // ignore
  }
}
