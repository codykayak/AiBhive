/**
 * Pros dispatch notifications — fetch inbox + respond from Diagnose.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export type ProsNotification = {
  id: string;
  title: string;
  body: string;
  type: 'job_update' | 'announcement' | 'dispatch';
  priority: 'normal' | 'high' | 'urgent';
  jobId: string | null;
  jobTitle: string | null;
  assigneeUid: string | null;
  status: 'pending' | 'completed' | 'declined';
  response: {
    completed: boolean;
    fixSummary: string;
    tipText?: string | null;
  } | null;
  createdAt: number | null;
};

export async function fetchProsNotifications(token: string): Promise<ProsNotification[]> {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/pros/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { notifications?: ProsNotification[] };
    return data.notifications || [];
  } catch {
    return [];
  }
}

export async function respondProsNotification(
  token: string,
  id: string,
  payload: { completed: boolean; fixSummary: string; tipText?: string; packId?: string; jobTitle?: string }
): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/pros/notifications/${id}/respond`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerProsPushToken(
  token: string,
  expoPushToken: string,
  platform: string
): Promise<boolean> {
  if (!API_BASE || !expoPushToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/pros/push/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expoPushToken, platform }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
