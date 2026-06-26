const STORAGE_KEY = 'aibhive_web_hive_uid';

/** Stable anonymous Hive user id for web store tools (matches mobile anonymous pattern). */
export function getOrCreateWebHiveUserId(): string {
  if (typeof window === 'undefined') return 'web_anonymous';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
