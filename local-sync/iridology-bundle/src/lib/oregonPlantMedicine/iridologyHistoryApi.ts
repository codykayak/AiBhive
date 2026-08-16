import type { User } from 'firebase/auth';
import type { IridologyStructuredResult, PlantChatMessage } from './plantMedicineApi';
import type { IridologyHistoryListItem, IridologySavedAnalysis } from './iridologyHistoryStorage';

export async function fetchIridologyHistory(user: User): Promise<IridologyHistoryListItem[]> {
  const token = await user.getIdToken();
  const res = await fetch('/api/plant-medicine/iridology/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { analyses?: IridologyHistoryListItem[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Could not load history');
  return Array.isArray(data.analyses) ? data.analyses : [];
}

export async function fetchIridologyAnalysis(user: User, analysisId: string): Promise<IridologySavedAnalysis> {
  const token = await user.getIdToken();
  const res = await fetch(`/api/plant-medicine/iridology/history/${encodeURIComponent(analysisId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { analysis?: IridologySavedAnalysis; error?: string };
  if (!res.ok || !data.analysis) throw new Error(data.error || 'Analysis not found');
  return data.analysis;
}

export async function sendIridologyFollowUpChat(
  user: User,
  analysisId: string,
  opts: { message: string; history?: PlantChatMessage[] },
): Promise<{ reply: string }> {
  const token = await user.getIdToken();
  const res = await fetch(`/api/plant-medicine/iridology/history/${encodeURIComponent(analysisId)}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: opts.message,
      history: opts.history ?? [],
    }),
  });
  const data = (await res.json()) as { ok?: boolean; reply?: string; error?: string };
  if (!res.ok || !data.reply) throw new Error(data.error || 'Follow-up chat failed');
  return { reply: data.reply };
}

export function buildLocalAnalysisRecord(opts: {
  id: string;
  methodology: string;
  eye: string;
  notes?: string;
  reply: string;
  structured: IridologyStructuredResult;
  photoPreviewUrls?: string[];
}): IridologySavedAnalysis {
  const now = new Date().toISOString();
  return {
    id: opts.id,
    createdAt: now,
    updatedAt: now,
    methodology: opts.methodology,
    eye: opts.eye,
    notes: opts.notes,
    reply: opts.reply,
    structured: opts.structured,
    chatMessages: [],
    photoPreviewUrls: opts.photoPreviewUrls,
  };
}
