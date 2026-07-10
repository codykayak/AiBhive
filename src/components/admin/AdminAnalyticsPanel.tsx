import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { BarChart3, Loader2, MousePointerClick, Eye, Activity } from 'lucide-react';
import { adminJson } from '../../lib/adminApi';

type AnalyticsSummary = {
  days: number;
  totals: { pageviews: number; clicks: number; totalEvents: number };
  daily: Array<{ day: string; pageviews: number; clicks: number; totalEvents: number }>;
  topPages: Array<{ path: string; count: number }>;
  recent: Array<{
    id: string;
    type: string;
    path: string;
    label?: string;
    createdAt?: string;
  }>;
  recentSpend: Array<{
    id: string;
    userId?: string;
    type?: string;
    feature?: string;
    amountUsd?: number;
    summary?: string;
    promoCode?: string;
    createdAt?: string;
  }>;
};

export default function AdminAnalyticsPanel({ user }: { user: User }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const summary = await adminJson<AnalyticsSummary>(`/api/admin/analytics?days=${days}`, user);
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxBar = Math.max(1, ...(data?.daily.map((d) => d.pageviews) || [1]));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-bee-amber" />
            Visitor analytics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            First-party pageviews, clicks, and recent Hive credit spend — no third-party trackers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Pageviews', value: data.totals.pageviews, icon: Eye },
              { label: 'Clicks / CTAs', value: data.totals.clicks, icon: MousePointerClick },
              { label: 'Total events', value: data.totals.totalEvents, icon: Activity },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Daily pageviews</h3>
            <div className="flex items-end gap-1.5 h-28">
              {data.daily.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-bee-amber/80 to-amber-200/90"
                    style={{ height: `${Math.max(4, (d.pageviews / maxBar) * 100)}%` }}
                    title={`${d.day}: ${d.pageviews} views`}
                  />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    {d.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Top pages</h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {data.topPages.length === 0 && (
                  <li className="text-sm text-slate-500">No pageviews yet — browse the site to seed data.</li>
                )}
                {data.topPages.map((p) => (
                  <li key={p.path} className="flex justify-between text-sm gap-3">
                    <span className="text-slate-300 truncate">{p.path}</span>
                    <span className="text-bee-amber font-semibold tabular-nums">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Recent activity</h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {data.recent.length === 0 && (
                  <li className="text-slate-500">Waiting for visitor events…</li>
                )}
                {data.recent.slice(0, 30).map((e) => (
                  <li key={e.id} className="border-b border-white/5 pb-2">
                    <span className="text-bee-amber text-xs uppercase">{e.type}</span>{' '}
                    <span className="text-slate-300">{e.path}</span>
                    {e.label ? <span className="text-slate-500"> · {e.label}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Hive credit activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Summary</th>
                    <th className="py-2 pr-3">Promo</th>
                    <th className="py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSpend.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-slate-500">
                        No ledger entries yet.
                      </td>
                    </tr>
                  )}
                  {data.recentSpend.map((row) => (
                    <tr key={row.id} className="border-t border-white/5 text-slate-300">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-500">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 pr-3">{row.type || row.feature || '—'}</td>
                      <td className="py-2 pr-3 max-w-xs truncate">{row.summary || '—'}</td>
                      <td className="py-2 pr-3 text-bee-amber">{row.promoCode || '—'}</td>
                      <td className="py-2 tabular-nums">
                        {typeof row.amountUsd === 'number' ? `$${row.amountUsd.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
