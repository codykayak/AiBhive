/** Stable Hive user id for web store tools — syncs with mobile when opened in WebView. */
const STORAGE_KEY = 'aibhive_web_hive_uid';

function readMobileHiveUserIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = new URLSearchParams(window.location.search).get('hiveUserId')?.trim();
    return id || null;
  } catch {
    return null;
  }
}

/** Stable anonymous Hive user id for web store tools (matches mobile anonymous pattern). */
export function getOrCreateWebHiveUserId(): string {
  if (typeof window === 'undefined') return 'web_anonymous';

  const mobileId = readMobileHiveUserIdFromUrl();
  if (mobileId) {
    localStorage.setItem(STORAGE_KEY, mobileId);
    return mobileId;
  }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
