const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export type ProsAiStatus = {
  configured: boolean;
  provider: string | null;
  source: string;
  billingStatus: string;
  aiEnabled: boolean;
};

export async function fetchProsAiStatus(token: string): Promise<ProsAiStatus | null> {
  if (!API_BASE || !token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/pros/ai-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProsAiStatus;
  } catch {
    return null;
  }
}
