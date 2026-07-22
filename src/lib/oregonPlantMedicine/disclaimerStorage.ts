/** Per-user disclaimer acceptance (localStorage; migrates anon → signed-in uid). */

export function disclaimerStorageKey(baseKey: string, uid?: string | null): string {
  return uid ? `${baseKey}:${uid}` : baseKey;
}

export function hasStoredDisclaimer(baseKey: string, version: string, uid?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const scoped = disclaimerStorageKey(baseKey, uid);
    if (localStorage.getItem(scoped) === version) return true;
    if (uid && localStorage.getItem(baseKey) === version) {
      localStorage.setItem(scoped, version);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function storeDisclaimerAcceptance(baseKey: string, version: string, uid?: string | null): void {
  const key = disclaimerStorageKey(baseKey, uid);
  localStorage.setItem(key, version);
}
