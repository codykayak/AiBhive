import type { User } from 'firebase/auth';

const apiBase = import.meta.env.VITE_API_URL ?? '';

async function portalFetch(path: string, user: User, options: RequestInit = {}) {
  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.hint || res.statusText);
  return data;
}

export type EmployeePortalMe = {
  ok: boolean;
  email: string;
  profile: {
    displayName: string;
    dailyChecklist: Record<string, boolean>;
    shiftNotes: string;
    lastChecklistDate: string | null;
  };
  links: {
    leadAgentApk: string;
    leadAgentHealth: string;
    macrorei: string;
    manydoors: string;
    aibhive: string;
  };
};

export async function fetchEmployeePortalMe(user: User) {
  return portalFetch('/api/employee-portal/me', user) as Promise<EmployeePortalMe>;
}

export async function saveEmployeePortalProfile(
  user: User,
  patch: Partial<EmployeePortalMe['profile']> & { lastChecklistDate?: string },
) {
  return portalFetch('/api/employee-portal/profile', user, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export async function employeePortalChat(
  user: User,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
) {
  return portalFetch('/api/employee-portal/chat', user, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  }) as Promise<{ reply: string }>;
}
