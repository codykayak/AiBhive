import type { FieldJob, JobStatus } from './storage';

/** Parse admin `scheduledFor` display strings into a sortable timestamp. */
export function parseScheduledAt(scheduledFor: string | null | undefined): number | null {
  if (!scheduledFor || !String(scheduledFor).trim()) return null;
  const raw = String(scheduledFor).trim();

  // ISO-ish: 2026-07-14 or 2026-07-14T09:30
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const iso = raw.includes('T') ? raw : raw.length === 10 ? `${raw}T08:00:00` : raw.replace(' ', 'T');
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms)) return ms;
  }

  const ms = Date.parse(raw);
  if (!Number.isNaN(ms)) return ms;
  return null;
}

const STATUS_RANK: Record<JobStatus, number> = {
  in_progress: 0,
  queued: 1,
  needs_parts: 2,
  done: 3,
};

/**
 * Field schedule order: soonest scheduled first, then unscheduled by status/updated.
 * Done jobs sink to the bottom unless they still have a future schedule.
 */
export function sortJobsBySchedule(jobs: FieldJob[]): FieldJob[] {
  return [...jobs].sort((a, b) => {
    const aDone = a.status === 'done' ? 1 : 0;
    const bDone = b.status === 'done' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    const aAt = a.scheduledAt ?? parseScheduledAt(a.scheduledFor);
    const bAt = b.scheduledAt ?? parseScheduledAt(b.scheduledFor);
    if (aAt != null && bAt != null && aAt !== bAt) return aAt - bAt;
    if (aAt != null && bAt == null) return -1;
    if (aAt == null && bAt != null) return 1;

    const statusDiff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;

    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

export function jobsOnDay(jobs: FieldJob[], day: Date): FieldJob[] {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const startMs = start.getTime();
  const endMs = end.getTime();

  return sortJobsBySchedule(
    jobs.filter((j) => {
      const at = j.scheduledAt ?? parseScheduledAt(j.scheduledFor);
      if (at == null) return false;
      return at >= startMs && at < endMs;
    })
  );
}

export function startOfWeek(d = new Date()): Date {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = day.getDay(); // 0 Sun
  day.setDate(day.getDate() - dow);
  return day;
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatJobScheduleLabel(job: FieldJob): string | null {
  if (job.scheduledFor?.trim()) return job.scheduledFor.trim();
  const at = job.scheduledAt;
  if (at == null) return null;
  return new Date(at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
