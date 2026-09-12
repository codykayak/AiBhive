export type IridologyMethodology = 'integrated' | 'jensen' | 'physical' | 'all';
export type IridologyEye = 'left' | 'right' | 'both' | 'unknown';
export type IridologyPhotoQuality = 'good' | 'fair' | 'poor';
export type IridologyConfidence = 'high' | 'medium' | 'low';

export const IRIDOLOGY_METHODOLOGY_LABELS: Record<IridologyMethodology, string> = {
  integrated: 'Integrated (recommended)',
  jensen: 'Jensen zone chart',
  physical: 'Physical / European',
  all: 'All schools (compare)',
};

export const IRIDOLOGY_PHOTO_QUALITY_LABELS: Record<IridologyPhotoQuality, string> = {
  good: 'Good — fine detail readable',
  fair: 'Fair — some limits; interpret cautiously',
  poor: 'Poor — retake recommended',
};

export const IRIDOLOGY_PHOTO_TIPS = [
  {
    title: 'Find soft daylight',
    detail:
      'Stand near a window with indirect light. Avoid direct sun, flash, and overhead LEDs that create glare on the cornea. Neutral daylight is required to judge base iris color.',
  },
  {
    title: 'Remove contacts & glasses',
    detail:
      'Contact lenses and smudged glasses add artifacts. Take glasses off unless you need them to see the screen. Colored contacts make constitutional typing meaningless.',
  },
  {
    title: 'Fill the frame with the iris',
    detail:
      'Pull the upper eyelid up gently. The colored iris should cover most of the photo — pupil and the full 360° limbus must be visible, not your whole face.',
  },
  {
    title: 'Hold steady for 2 seconds',
    detail:
      'Blur hides fiber detail. Rest your phone on something stable or use both hands before tapping capture. Stromal fibers must be resolvable.',
  },
  {
    title: 'One eye at a time',
    detail:
      'Close the other eye. Label left vs right. For comparison, repeat with matching light, distance, and laterality.',
  },
] as const;

export const IRIDOLOGY_PHOTO_DOS = [
  'Use the front camera or mirror + rear camera in bright light',
  'Keep 4–8 inches (10–20 cm) from the eye',
  'Look straight ahead — do not roll the eye',
  'Wipe the lens clean before shooting',
] as const;

export const IRIDOLOGY_PHOTO_AVOIDS = [
  'No flash — it washes out iris fibers',
  'No filters or beauty mode',
  'No extreme zoom (digital zoom blurs detail)',
  'Do not photograph if the eye is red, painful, or vision is changing — see a doctor',
] as const;

export type IridologyObservation = {
  sign: string;
  zone: string;
  meaning: string;
  confidence: IridologyConfidence;
  sources: string[];
  clockHour?: string;
  ring?: string;
  visibleEvidence?: string;
};

export type IridologyConstitutionalType = {
  label: string;
  confidence: IridologyConfidence;
  rationale: string;
};

export type IridologyStructuredReport = {
  methodology: IridologyMethodology | string;
  eye: IridologyEye | string;
  photoQuality: IridologyPhotoQuality | string;
  retakeAdvice?: string;
  photoAssessment?: string;
  globalOverview?: string;
  fiberAndTexture?: string;
  integratedSummary?: string;
  nextSteps?: string[];
  constitutionalType?: IridologyConstitutionalType | null;
  observations: IridologyObservation[];
  wellnessTendencies: string[];
  cautions: string[];
};

export type IridologyChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type IridologySavedAnalysis = {
  id: string;
  createdAt: string;
  updatedAt: string;
  methodology: string;
  eye: string;
  notes: string;
  reply: string;
  structured: IridologyStructuredReport;
  chatMessages: IridologyChatMessage[];
  photoPreviewUrls?: string[];
};

export type IridologyHistorySummary = {
  id: string;
  createdAt: string;
  methodology: string;
  eye: string;
  photoQuality?: string;
  constitutionalLabel?: string;
  summaryLine: string;
  chatCount: number;
};

const HISTORY_KEY = 'lk_iridology_history_v1';

export function iridologyHistoryStorageKey(uid: string | null | undefined): string {
  return `${HISTORY_KEY}_${uid || 'anonymous'}`;
}

export function loadIridologyHistory(uid: string | null | undefined): IridologySavedAnalysis[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(iridologyHistoryStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as IridologySavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

export function saveIridologyHistoryItem(uid: string | null | undefined, item: IridologySavedAnalysis): void {
  if (typeof localStorage === 'undefined') return;
  const next = [item, ...loadIridologyHistory(uid).filter((row) => row.id !== item.id)].slice(0, 30);
  localStorage.setItem(iridologyHistoryStorageKey(uid), JSON.stringify(next));
}

export function updateIridologyHistoryChat(
  uid: string | null | undefined,
  id: string,
  chatMessages: IridologyChatMessage[],
): void {
  if (typeof localStorage === 'undefined') return;
  const list = loadIridologyHistory(uid);
  const idx = list.findIndex((row) => row.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx]!, chatMessages, updatedAt: new Date().toISOString() };
  localStorage.setItem(iridologyHistoryStorageKey(uid), JSON.stringify(list));
}

export function makeIridologyHistoryRecord(opts: {
  id: string;
  methodology: string;
  eye: string;
  notes: string;
  reply: string;
  structured: IridologyStructuredReport;
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

export function toIridologyHistorySummary(row: IridologySavedAnalysis): IridologyHistorySummary {
  return {
    id: row.id,
    createdAt: row.createdAt,
    methodology: row.methodology,
    eye: row.eye,
    photoQuality: row.structured?.photoQuality,
    constitutionalLabel: row.structured?.constitutionalType?.label,
    summaryLine: row.structured?.integratedSummary?.slice(0, 160) || row.reply.slice(0, 160),
    chatCount: row.chatMessages?.length ?? 0,
  };
}

export function mergeIridologyHistory(
  serverRows: IridologyHistorySummary[],
  localRows: IridologySavedAnalysis[],
): IridologyHistorySummary[] {
  const map = new Map<string, IridologyHistorySummary>();
  for (const row of serverRows) map.set(row.id, row);
  for (const row of localRows) {
    if (!map.has(row.id)) map.set(row.id, toIridologyHistorySummary(row));
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function eyeCapturePrompt(eye: string): string {
  return eye === 'left' ? 'Left eye — close your right eye' : 'Right eye — close your left eye';
}

export function followUpContextFromAnalysis(item: IridologySavedAnalysis): string {
  const a = item.structured;
  return [
    '--- SAVED IRIS ANALYSIS (follow-up context) ---',
    `Eye: ${a.eye}`,
    `Photo quality: ${a.photoQuality}`,
    a.integratedSummary ? `Summary: ${a.integratedSummary}` : '',
    a.constitutionalType ? `Constitutional: ${a.constitutionalType.label} — ${a.constitutionalType.rationale}` : '',
    item.reply.slice(0, 5000),
  ]
    .filter(Boolean)
    .join('\n');
}
