export type BurnPreset = {
  id: string;
  label: string;
  hourlyUsd: number;
  hint: string;
};

export const BURN_PRESETS: BurnPreset[] = [
  { id: 'startup', label: 'Startup team', hourlyUsd: 75, hint: 'Mixed eng + ops' },
  { id: 'agency', label: 'Agency / consulting', hourlyUsd: 125, hint: 'Billable blended rate' },
  { id: 'enterprise', label: 'Enterprise', hourlyUsd: 165, hint: 'Corp loaded cost' },
  { id: 'executive', label: 'Executive room', hourlyUsd: 250, hint: 'C-suite + advisors' },
];

export type BurnSession = {
  id: string;
  title: string;
  attendees: number;
  hourlyUsd: number;
  elapsedMs: number;
  endedAt: string;
  totalUsd: number;
};

const HISTORY_KEY = 'aibhive_meeting_burn_history';

export function costPerSecond(attendees: number, hourlyUsd: number): number {
  return (Math.max(1, attendees) * Math.max(1, hourlyUsd)) / 3600;
}

export function formatUsd(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export function burnQuip(totalUsd: number): string | null {
  if (totalUsd >= 500) return 'That could fund a sprint of shipped features.';
  if (totalUsd >= 250) return 'A freelance specialist could have delivered a draft in this window.';
  if (totalUsd >= 100) return 'This block could have been an async Loom + doc review.';
  if (totalUsd >= 50) return 'Consider: was everyone in this room essential?';
  if (totalUsd >= 25) return 'Still early — set an agenda if you do not have one.';
  return null;
}

export function loadBurnHistory(): BurnSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BurnSession[];
  } catch {
    return [];
  }
}

export function saveBurnSession(session: BurnSession) {
  const prev = loadBurnHistory().filter((s) => s.id !== session.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...prev].slice(0, 8)));
}

export function shareText(opts: {
  title: string;
  attendees: number;
  hourlyUsd: number;
  elapsedMs: number;
  totalUsd: number;
}): string {
  const mins = Math.round(opts.elapsedMs / 60000);
  return [
    `Meeting Burn — ${opts.title || 'Untitled meeting'}`,
    `${mins} min · ${opts.attendees} people · ${formatUsd(opts.hourlyUsd)}/hr blended`,
    `Total burn: ${formatUsd(opts.totalUsd)}`,
    '',
    'Tracked with AiBhive Meeting Burn → aibhive.com/hive-apps/run/example-meeting-burn',
  ].join('\n');
}
