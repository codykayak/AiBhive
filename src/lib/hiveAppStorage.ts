const PREFIX = 'hive_app_data:';

function key(appId: string, pageId: string): string {
  return `${PREFIX}${appId}:${pageId}`;
}

export function loadPageData<T>(appId: string, pageId: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(appId, pageId));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePageData<T>(appId: string, pageId: string, value: T): void {
  try {
    localStorage.setItem(key(appId, pageId), JSON.stringify(value));
  } catch {
    // quota or private mode
  }
}
