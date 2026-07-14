import type { ProsJob, ProsMember } from '../lib/prosApi';

export type ProsTechJobStats = {
  uid: string;
  displayName: string;
  role: ProsMember['role'];
  jobsThisWeek: number;
  jobsThisMonth: number;
  recentCompleted: Array<{ id: string; title: string; completedAt: number }>;
};

function startOfWeekMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function jobCompletedAt(job: ProsJob): number | null {
  if (job.status !== 'done') return null;
  const ts = job.completedAt ?? job.updatedAt;
  return typeof ts === 'number' && ts > 0 ? ts : null;
}

export function buildProsTechJobStats(jobs: ProsJob[], members: ProsMember[]): ProsTechJobStats[] {
  const weekStart = startOfWeekMonday().getTime();
  const monthStart = startOfMonth().getTime();
  const now = Date.now();

  const completed = jobs
    .map((job) => {
      const completedAt = jobCompletedAt(job);
      if (!completedAt || !job.assigneeUid) return null;
      return { job, completedAt };
    })
    .filter((row): row is { job: ProsJob; completedAt: number } => Boolean(row));

  return members
    .filter((m) => m.status !== 'inactive' && (m.role === 'tech' || m.role === 'manager'))
    .map((member) => {
      const mine = completed.filter((row) => row.job.assigneeUid === member.uid);
      const jobsThisWeek = mine.filter((row) => row.completedAt >= weekStart && row.completedAt <= now).length;
      const jobsThisMonth = mine.filter((row) => row.completedAt >= monthStart && row.completedAt <= now).length;
      const recentCompleted = mine
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 8)
        .map((row) => ({
          id: row.job.id,
          title: row.job.title,
          completedAt: row.completedAt,
        }));

      return {
        uid: member.uid,
        displayName: member.displayName || member.email || 'Tech',
        role: member.role,
        jobsThisWeek,
        jobsThisMonth,
        recentCompleted,
      };
    })
    .sort((a, b) => b.jobsThisWeek - a.jobsThisWeek || b.jobsThisMonth - a.jobsThisMonth);
}

export function formatReportWeekLabel(d = new Date()) {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function formatReportMonthLabel(d = new Date()) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
