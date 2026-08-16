import type { IridologyStructuredResult, PlantChatMessage } from './plantMedicineApi';

export type IridologySavedAnalysis = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  methodology: string;
  eye: string;
  notes?: string;
  reply: string;
  structured: IridologyStructuredResult;
  chatMessages?: PlantChatMessage[];
  /** Local-only thumbnail previews (not synced to server). */
  photoPreviewUrls?: string[];
};

export type IridologyHistoryListItem = {
  id: string;
  createdAt: string;
  methodology: string;
  eye: string;
  photoQuality?: string;
  constitutionalLabel?: string;
  summaryLine?: string;
  chatCount?: number;
};

const STORAGE_PREFIX = 'lk_iridology_history_v1';

function storageKey(uid: string | null) {
  return `${STORAGE_PREFIX}_${uid || 'anonymous'}`;
}

export function loadLocalIridologyHistory(uid: string | null): IridologySavedAnalysis[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IridologySavedAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalIridologyAnalysis(uid: string | null, analysis: IridologySavedAnalysis) {
  if (typeof localStorage === 'undefined') return;
  const existing = loadLocalIridologyHistory(uid).filter((a) => a.id !== analysis.id);
  const next = [analysis, ...existing].slice(0, 30);
  localStorage.setItem(storageKey(uid), JSON.stringify(next));
}

export function getLocalIridologyAnalysis(uid: string | null, id: string): IridologySavedAnalysis | null {
  return loadLocalIridologyHistory(uid).find((a) => a.id === id) ?? null;
}

export function updateLocalIridologyChat(uid: string | null, id: string, chatMessages: PlantChatMessage[]) {
  const list = loadLocalIridologyHistory(uid);
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], chatMessages, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(uid), JSON.stringify(list));
}

export function mergeHistoryLists(
  remote: IridologyHistoryListItem[],
  local: IridologySavedAnalysis[],
): IridologyHistoryListItem[] {
  const map = new Map<string, IridologyHistoryListItem>();
  for (const r of remote) map.set(r.id, r);
  for (const l of local) {
    if (!map.has(l.id)) {
      map.set(l.id, {
        id: l.id,
        createdAt: l.createdAt,
        methodology: l.methodology,
        eye: l.eye,
        photoQuality: l.structured.photoQuality,
        constitutionalLabel: l.structured.constitutionalType?.label,
        summaryLine: l.structured.integratedSummary?.slice(0, 160) || l.reply.slice(0, 160),
        chatCount: l.chatMessages?.length ?? 0,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
