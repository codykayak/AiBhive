import type { User } from 'firebase/auth';

const apiBase = import.meta.env.VITE_API_URL ?? '';

export async function adminFetch(
  path: string,
  user: User,
  options: RequestInit = {}
): Promise<Response> {
  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBase}${path}`, { ...options, headers });
}

export async function adminJson<T>(
  path: string,
  user: User,
  options?: RequestInit
): Promise<T> {
  const res = await adminFetch(path, user, options);
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error ?? text;
    } catch {
      /* plain text */
    }
    const err = new Error(message || `Request failed (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}
