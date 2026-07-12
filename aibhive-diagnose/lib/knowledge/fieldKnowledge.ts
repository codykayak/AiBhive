const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export type KnowledgeFeedbackPayload = {
  outcome: 'worked' | 'didnt';
  userQuery: string;
  assistantReply: string;
  packId: string;
  source?: string;
  tipIdsUsed?: string[];
  messageId?: string;
  equipment?: string[];
  equipmentSymptom?: string;
  fixSummary?: string;
  shareWithTeam?: boolean;
  shareAnonymously?: boolean;
  tipText?: string;
};

export async function submitFieldFeedback(token: string, payload: KnowledgeFeedbackPayload) {
  if (!API_BASE) throw new Error('API URL not configured');
  const res = await fetch(`${API_BASE}/api/pros/knowledge/feedback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `Feedback failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) msg = parsed.error;
    } catch {
      // keep
    }
    throw new Error(msg);
  }
  return res.json() as Promise<{ success: boolean; companyTipId?: string; globalTipId?: string }>;
}

export async function searchFieldTips(token: string, q: string, packId?: string) {
  if (!API_BASE) return { tips: [] as Array<{ id: string; text: string; scope?: string }> };
  const params = new URLSearchParams({ q, limit: '5' });
  if (packId) params.set('packId', packId);
  const res = await fetch(`${API_BASE}/api/pros/knowledge/tips?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { tips: [] };
  return res.json();
}
