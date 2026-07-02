export type ReactorPreset = {
  id: string;
  label: string;
  targetMs: number;
  hint: string;
};

export const REACTOR_PRESETS: ReactorPreset[] = [
  { id: 'sprint', label: 'Focus sprint', targetMs: 25 * 60_000, hint: '25 min pomodoro' },
  { id: 'deep', label: 'Deep work', targetMs: 45 * 60_000, hint: '45 min block' },
  { id: 'flow', label: 'Flow state', targetMs: 90 * 60_000, hint: '90 min immersion' },
  { id: 'free', label: 'Free run', targetMs: 0, hint: 'No target — just build charge' },
];

export type ReactorSession = {
  id: string;
  label: string;
  elapsedMs: number;
  peakCharge: number;
  focusUnits: number;
  endedAt: string;
};

const HISTORY_KEY = 'aibhive_focus_reactor_history';

export function chargeFromElapsed(elapsedMs: number, targetMs: number): number {
  if (targetMs > 0) return Math.min(1, elapsedMs / targetMs);
  // Free run: asymptotic charge toward 100% over ~60 min
  return 1 - Math.exp(-elapsedMs / (45 * 60_000));
}

export function reactorRpm(charge: number): number {
  return Math.round(120 + charge * 880);
}

export function reactorHeat(charge: number): number {
  return Math.round(charge * 100);
}

export function focusUnits(elapsedMs: number, charge: number): number {
  const minutes = elapsedMs / 60_000;
  return Math.round(minutes * (0.5 + charge * 1.5) * 10) / 10;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function reactorQuip(charge: number): string | null {
  if (charge >= 0.95) return 'Critical mass — you are in the zone.';
  if (charge >= 0.75) return 'Reactor humming. Protect this block.';
  if (charge >= 0.5) return 'Half charge. Momentum is building.';
  if (charge >= 0.25) return 'Ignition sequence — stay with it.';
  return null;
}

export function loadReactorHistory(): ReactorSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReactorSession[];
  } catch {
    return [];
  }
}

export function saveReactorSession(session: ReactorSession) {
  const prev = loadReactorHistory().filter((s) => s.id !== session.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...prev].slice(0, 8)));
}

export function shareReactorText(opts: {
  label: string;
  elapsedMs: number;
  charge: number;
  focusUnits: number;
}): string {
  return [
    `Focus Reactor — ${opts.label || 'Deep work session'}`,
    `${formatDuration(opts.elapsedMs)} · ${Math.round(opts.charge * 100)}% charge`,
    `Focus units generated: ${opts.focusUnits}`,
    '',
    'aibhive.com/hive-apps/run/example-focus-reactor',
  ].join('\n');
}

/** Apps hidden from store listings but still runnable by direct URL. */
export const HIDDEN_STORE_APP_IDS = new Set(['example-job-tracker']);
