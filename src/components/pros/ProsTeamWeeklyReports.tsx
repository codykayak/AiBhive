import { useMemo, useState } from 'react';
import { BarChart3, Calendar, ChevronRight, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ProsJob, ProsMember } from '../../lib/prosApi';
import {
  buildProsTechJobStats,
  formatReportMonthLabel,
  formatReportWeekLabel,
  type ProsTechJobStats,
} from '../../lib/prosTeamReports';
import { prosAdmin as t } from './prosAdminTheme';

type Props = {
  jobs: ProsJob[];
  members: ProsMember[];
  isManager: boolean;
  currentUserUid?: string | null;
};

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center min-w-[7rem]">
      <div className="text-2xl font-black text-[#1E3A8A]">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function TechDetail({ stats }: { stats: ProsTechJobStats }) {
  return (
    <div className={`${t.card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-lg text-slate-900">{stats.displayName}</h3>
          <p className="text-sm text-slate-500 capitalize">{stats.role} · job completion report</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill label="This week" value={stats.jobsThisWeek} />
          <StatPill label="This month" value={stats.jobsThisMonth} />
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>
            Week of <strong>{formatReportWeekLabel()}</strong>
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center gap-2 text-slate-700">
          <BarChart3 className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>
            Month: <strong>{formatReportMonthLabel()}</strong>
          </span>
        </div>
      </div>

      {stats.recentCompleted.length ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recent completions</p>
          <ul className="space-y-2">
            {stats.recentCompleted.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800 truncate">{job.title}</span>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {new Date(job.completedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">No completed jobs recorded for this tech yet.</p>
      )}
    </div>
  );
}

export default function ProsTeamWeeklyReports({ jobs, members, isManager, currentUserUid }: Props) {
  const stats = useMemo(() => buildProsTechJobStats(jobs, members), [jobs, members]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const selected = stats.find((row) => row.uid === (selectedUid ?? currentUserUid)) ?? stats[0] ?? null;

  if (!isManager) {
    const mine = currentUserUid ? stats.find((row) => row.uid === currentUserUid) : null;
    if (!mine) return null;
    return <TechDetail stats={mine} />;
  }

  if (!stats.length) {
    return (
      <div className={`${t.cardSubtle} p-4 text-sm text-slate-600`}>
        Invite techs to your team to see weekly and monthly job completion reports.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${t.card} p-4`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <BarChart3 className="w-4 h-4 text-[#F5A623]" />
          Weekly reporting
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Click a tech to see how many jobs they completed this week and this month.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-4 items-start">
        <ul className="space-y-2">
          {stats.map((row) => {
            const active = selected?.uid === row.uid;
            return (
              <li key={row.uid}>
                <button
                  type="button"
                  onClick={() => setSelectedUid(row.uid)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                    active
                      ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className={t.avatar}>
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{row.displayName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.jobsThisWeek} this week · {row.jobsThisMonth} this month
                    </div>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 shrink-0', active ? 'text-[#1E3A8A]' : 'text-slate-400')} />
                </button>
              </li>
            );
          })}
        </ul>

        {selected ? <TechDetail stats={selected} /> : null}
      </div>
    </div>
  );
}
