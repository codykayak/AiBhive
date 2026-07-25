const PLANTS_HOSTS = new Set(['aibhive.com', 'www.aibhive.com']);

/** Hosts required for Google / Firebase sign-in inside the plants WebView. */
const AUTH_HOST_SUFFIXES = [
  'accounts.google.com',
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'firebaseapp.com',
  'web.app',
];

export function isPlantsInAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (AUTH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
      return true;
    }

    if (!PLANTS_HOSTS.has(host)) return false;

    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return path === '/plants' || path.startsWith('/plants/');
  } catch {
    return false;
  }
}
