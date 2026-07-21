import type { User } from 'firebase/auth';

const apiBase = import.meta.env.VITE_API_URL ?? '';

function parseApiError(text: string, status: number): string {
  try {
    const json = JSON.parse(text);
    return json.error ?? text;
  } catch {
    if (text.includes('Payload Too Large') || status === 413) {
      return 'Photo upload too large — the app will compress images automatically; try again or use a smaller photo.';
    }
    if (text.trimStart().startsWith('<!')) {
      return `Request failed (${status}). If this persists, restart the dev server.`;
    }
    return text;
  }
}

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
    const message = parseApiError(text, res.status);
    const err = new Error(message || `Request failed (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function adminFormData<T>(
  path: string,
  user: User,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST'
): Promise<T> {
  const token = await user.getIdToken();
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    const message = parseApiError(text, res.status);
    const err = new Error(message || `Request failed (${res.status})`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}
