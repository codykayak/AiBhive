import { BarChart3, Clock, Download, Headphones, Users } from 'lucide-react';
import type { DeskCallLog, DeskCallTracking } from '../../lib/employeePortalApi';

const DISPOSITION_META: Record<string, { label: string; tone: string }> = {
  talked: { label: 'Talked', tone: 'bg-emerald-500/25 text-emerald-100 border-emerald-500/30' },
  voicemail: { label: 'Voicemail', tone: 'bg-sky-500/20 text-sky-100 border-sky-500/30' },
  no_answer: { label: 'No answer', tone: 'bg-slate-500/25 text-slate-200 border-slate-500/30' },
  callback: { label: 'Callback', tone: 'bg-amber-500/25 text-amber-100 border-amber-500/30' },
  skipped: { label: 'Skipped', tone: 'bg-white/10 text-slate-300 border-white/15' },
};

export function dispositionBadge(disposition: string) {
  const meta = DISPOSITION_META[disposition] || { label: disposition || '—', tone: 'bg-white/10 text-slate-300 border-white/15' };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

export function formatDuration(sec: number | null | undefined) {
  if (sec == null || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export function formatCallWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function channelLabel(channel: string) {
  if (channel === 'twilio_browser') return 'Browser dialer';
  if (channel === 'manual') return 'Manual log';
  return channel;
}

type TrackingProps = {
  tracking: DeskCallTracking | undefined;
  shiftCalls: number;
  shiftTexts: number;
  onOpenLog?: () => void;
};

export function CallTrackingSummary({ tracking, shiftCalls, shiftTexts, onOpenLog }: TrackingProps) {
  const maxHour = Math.max(1, ...(tracking?.hourlyToday || []).map((h) => h.count));
  const dispositions = Object.entries(tracking?.byDisposition || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          ['Calls today (floor)', tracking?.todayCalls ?? shiftCalls],
          ['Conversations', tracking?.todayTalked ?? 0],
          ['Connect rate', tracking?.connectRatePct != null ? `${tracking.connectRatePct}%` : '—'],
          ['Avg talk time', formatDuration(tracking?.avgDurationSec)],
          ['Your shift calls', shiftCalls],
          ['Your shift texts', shiftTexts],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
            <p className="text-2xl font-black mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="rounded-2xl border border-white/10 p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-bee-amber" /> Calls by hour (today, {tracking?.timezone || 'PT'})
            </h3>
            {onOpenLog ? (
              <button type="button" onClick={onOpenLog} className="text-xs font-bold text-bee-amber hover:underline">
                Full call log →
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex items-end gap-1 h-28">
            {(tracking?.hourlyToday || []).map((bucket) => (
              <div key={bucket.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full rounded-t bg-bee-amber/80 min-h-[2px] transition-all"
                  style={{ height: `${Math.round((bucket.count / maxHour) * 100)}%` }}
                  title={`${bucket.hour}:00 — ${bucket.count} calls`}
                />
                <span className="text-[8px] text-slate-600 tabular-nums">{bucket.hour % 6 === 0 ? bucket.hour : ''}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-4">
          <h3 className="font-bold flex items-center gap-2">
            <Headphones className="w-4 h-4 text-bee-amber" /> Dispositions
          </h3>
          <ul className="mt-3 space-y-2">
            {dispositions.length ? (
              dispositions.map(([id, count]) => (
                <li key={id} className="flex items-center justify-between gap-2 text-sm">
                  {dispositionBadge(id)}
                  <span className="font-black tabular-nums">{count}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500">No calls logged yet — dispositions on the dialer build this chart.</p>
            )}
          </ul>
        </section>
      </div>

      {tracking?.byAgent?.length ? (
        <section className="rounded-2xl border border-white/10 p-4">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-bee-amber" /> Agent activity (recent log window)
          </h3>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="text-left py-1">Agent</th>
                  <th className="text-right py-1">Calls</th>
                  <th className="text-right py-1">Talked</th>
                  <th className="text-right py-1">Callbacks</th>
                </tr>
              </thead>
              <tbody>
                {tracking.byAgent.map((row) => (
                  <tr key={row.email} className="border-t border-white/5">
                    <td className="py-2 font-mono text-xs truncate max-w-[200px]">{row.email}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{row.calls}</td>
                    <td className="py-2 text-right tabular-nums text-emerald-300">{row.talked}</td>
                    <td className="py-2 text-right tabular-nums text-amber-200">{row.callbacks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

type FeedProps = {
  feed: DeskCallLog[];
  onSelectLead?: (leadId: string) => void;
  filterDisposition?: string;
  onExport?: () => void;
};

export function CallLogTable({ feed, onSelectLead, filterDisposition = 'all', onExport }: FeedProps) {
  const rows = feed.filter((r) => filterDisposition === 'all' || r.disposition === filterDisposition);

  return (
    <section className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-bee-amber" /> Call log ({rows.length})
        </h3>
        {onExport ? (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        ) : null}
      </div>
      <div className="max-h-[min(65vh,640px)] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#0b1018] text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3 text-left">When</th>
              <th className="p-3 text-left">Lead</th>
              <th className="p-3 text-left hidden md:table-cell">Property</th>
              <th className="p-3">Disposition</th>
              <th className="p-3 hidden lg:table-cell">Duration</th>
              <th className="p-3 hidden lg:table-cell">Channel</th>
              <th className="p-3 hidden xl:table-cell">Agent</th>
              <th className="p-3 hidden xl:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="p-3 text-xs text-slate-400 whitespace-nowrap">{formatCallWhen(row.at)}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-left font-semibold hover:text-bee-amber"
                    onClick={() => onSelectLead?.(row.leadId)}
                  >
                    {row.leadName || 'Owner'}
                    <span className="block font-mono text-[11px] text-slate-500 font-normal">{row.leadPhone}</span>
                  </button>
                </td>
                <td className="p-3 hidden md:table-cell text-xs text-slate-400 max-w-[200px] truncate">{row.propertyAddress}</td>
                <td className="p-3 text-center">{dispositionBadge(row.disposition)}</td>
                <td className="p-3 hidden lg:table-cell text-xs tabular-nums text-center">{formatDuration(row.durationSec)}</td>
                <td className="p-3 hidden lg:table-cell text-xs text-slate-500">{channelLabel(row.channel)}</td>
                <td className="p-3 hidden xl:table-cell text-[11px] font-mono text-slate-500 truncate max-w-[140px]">{row.employeeEmail}</td>
                <td className="p-3 hidden xl:table-cell text-xs text-slate-400 max-w-[200px] truncate">{row.notes || '—'}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Every disposition you save on the dialer appears here with timestamp, agent, and notes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function exportCallLogCsv(feed: DeskCallLog[], businessName: string) {
  const header = ['when', 'lead', 'phone', 'property', 'disposition', 'duration_sec', 'channel', 'agent', 'notes'];
  const lines = feed.map((r) =>
    [
      r.at || '',
      r.leadName,
      r.leadPhone,
      r.propertyAddress,
      r.disposition,
      r.durationSec ?? '',
      r.channel,
      r.employeeEmail,
      (r.notes || '').replace(/"/g, '""'),
    ]
      .map((c) => `"${String(c)}"`)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `call-log-${businessName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
