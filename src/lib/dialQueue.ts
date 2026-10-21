import type { DeskLead } from './employeePortalApi';
import { localHourInTz } from './dialTimeGuard';

/** Normalize situs/mailing address for duplicate detection on import. */
export function normalizePropertyAddressKey(address: string) {
  return String(address || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .slice(0, 160);
}

/** Lower = sooner in power-dial queue. Due callbacks first, then scheduled, then new. */
export function queuePriority(lead: Pick<DeskLead, 'status' | 'callbackAt'>) {
  const status = lead.status || 'new';
  if (status === 'callback' && lead.callbackAt) {
    const t = new Date(lead.callbackAt).getTime();
    if (!Number.isNaN(t) && t <= Date.now()) return 0;
    if (!Number.isNaN(t) && t > Date.now()) return 300;
    return 100;
  }
  if (status === 'callback') return 50;
  if (status === 'new') return 200;
  return 500;
}

export function compareDialQueue(a: DeskLead, b: DeskLead) {
  const pa = queuePriority(a);
  const pb = queuePriority(b);
  if (pa !== pb) return pa - pb;
  if (a.status === 'callback' && b.status === 'callback' && a.callbackAt && b.callbackAt) {
    const ta = new Date(a.callbackAt).getTime();
    const tb = new Date(b.callbackAt).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  }
  return (a.name || '').localeCompare(b.name || '');
}

export function sortDialQueue(leads: DeskLead[]) {
  return [...leads].sort(compareDialQueue);
}

export function callbackPresetIso(preset: '15m' | '1h' | 'tomorrow10', tz = 'America/Los_Angeles') {
  const now = new Date();
  if (preset === '15m') return new Date(now.getTime() + 15 * 60_000).toISOString();
  if (preset === '1h') return new Date(now.getTime() + 60 * 60_000).toISOString();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
  let cursor = new Date(now.getTime() + 18 * 60 * 60_000);
  for (let i = 0; i < 96; i += 1) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(cursor);
    if (day > today && localHourInTz(cursor, tz) === 10) return cursor.toISOString();
    cursor = new Date(cursor.getTime() + 15 * 60_000);
  }
  return new Date(now.getTime() + 24 * 60 * 60_000).toISOString();
}
