import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Ticket, Loader2, Plus, Trash2, Power } from 'lucide-react';
import { adminJson } from '../../lib/adminApi';

type Promo = {
  id: string;
  code?: string;
  partnerName?: string;
  label?: string;
  note?: string;
  markupMultiplier?: number;
  active?: boolean;
  maxRedemptions?: number | null;
  redemptionCount?: number;
  expiresAt?: string | null;
  createdAt?: string;
};

export default function AdminPromoCodesPanel({ user }: { user: User }) {
  const [codes, setCodes] = useState<Promo[]>([]);
  const [defaultMarkup, setDefaultMarkup] = useState(1.08);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [form, setForm] = useState({
    code: '',
    partnerName: '',
    note: '',
    markupMultiplier: '1.08',
    maxRedemptions: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminJson<{ codes: Promo[]; defaultMarkupMultiplier?: number }>(
        '/api/admin/promo-codes',
        user,
      );
      setCodes(data.codes || []);
      if (data.defaultMarkupMultiplier) setDefaultMarkup(data.defaultMarkupMultiplier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPromo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOkMsg('');
    try {
      const code = (form.code || form.partnerName).trim();
      await adminJson('/api/admin/promo-codes', user, {
        method: 'POST',
        body: JSON.stringify({
          code,
          partnerName: form.partnerName || code,
          label: form.partnerName || code,
          note: form.note,
          markupMultiplier: Number(form.markupMultiplier) || defaultMarkup,
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
          active: true,
        }),
      });
      setOkMsg(`Promo ${code.toUpperCase()} saved — partners pay near-cost Hive credits.`);
      setForm({
        code: '',
        partnerName: '',
        note: '',
        markupMultiplier: String(defaultMarkup),
        maxRedemptions: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(code: string, active: boolean) {
    try {
      await adminJson(`/api/admin/promo-codes/${encodeURIComponent(code)}`, user, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function remove(code: string) {
    if (!confirm(`Delete promo ${code}? Existing redemptions stay on user accounts.`)) return;
    try {
      await adminJson(`/api/admin/promo-codes/${encodeURIComponent(code)}`, user, {
        method: 'DELETE',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-bee-amber" />
          Creator promo codes
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Make a code from a YouTuber or podcaster&apos;s name. When they redeem it in Research Lab,
          they pay <strong className="text-slate-300">near our API &amp; server cost</strong> (default{' '}
          {defaultMarkup}×) instead of standard Hive credit rates — still a little margin for the
          platform.
        </p>
      </div>

      <form
        onSubmit={createPromo}
        className="rounded-2xl border border-bee-amber/25 bg-bee-amber/5 p-4 grid sm:grid-cols-2 gap-3"
      >
        <label className="text-xs text-slate-400 flex flex-col gap-1">
          Partner name
          <input
            required
            value={form.partnerName}
            onChange={(e) => {
              const partnerName = e.target.value;
              setForm((f) => ({
                ...f,
                partnerName,
                code: f.code || partnerName.replace(/\s+/g, '').toUpperCase(),
              }));
            }}
            placeholder="Joe Rogan"
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
          />
        </label>
        <label className="text-xs text-slate-400 flex flex-col gap-1">
          Promo code
          <input
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="JOEROGAN"
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
          />
        </label>
        <label className="text-xs text-slate-400 flex flex-col gap-1">
          Near-cost multiplier (1.08 = ~8% over raw)
          <input
            type="number"
            min={1}
            max={2}
            step={0.01}
            value={form.markupMultiplier}
            onChange={(e) => setForm((f) => ({ ...f, markupMultiplier: e.target.value }))}
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
          />
        </label>
        <label className="text-xs text-slate-400 flex flex-col gap-1">
          Max redemptions (optional)
          <input
            type="number"
            min={1}
            value={form.maxRedemptions}
            onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
            placeholder="Unlimited"
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
          />
        </label>
        <label className="text-xs text-slate-400 flex flex-col gap-1 sm:col-span-2">
          Note (private)
          <input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Sent link 2026-07 — podcast guest"
            className="px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
          />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bee-amber text-bee-black font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add promo code
          </button>
          {okMsg && <span className="text-sm text-green-400">{okMsg}</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-bee-amber animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 bg-black/40">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Redeemed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-slate-500">
                    No promo codes yet — add one above for your next creator send.
                  </td>
                </tr>
              )}
              {codes.map((c) => {
                const code = c.code || c.id;
                return (
                  <tr key={code} className="border-t border-white/5 text-slate-300">
                    <td className="px-4 py-3 font-mono text-bee-amber">{code}</td>
                    <td className="px-4 py-3">{c.partnerName || c.label || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{c.markupMultiplier ?? defaultMarkup}×</td>
                    <td className="px-4 py-3 tabular-nums">
                      {c.redemptionCount ?? 0}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.active === false ? 'text-red-400' : 'text-green-400'
                        }
                      >
                        {c.active === false ? 'Off' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        type="button"
                        title={c.active === false ? 'Activate' : 'Deactivate'}
                        onClick={() => void toggleActive(code, c.active === false)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => void remove(code)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
