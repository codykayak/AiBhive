import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function RvEnterpriseLeadForm() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [rooftops, setRooftops] = useState('');
  const [dms, setDms] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rv/enterprise-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          email,
          rooftops: rooftops ? Number(rooftops) : undefined,
          dms,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-200 text-sm">
        Thanks — we&apos;ll reach out about your RV rollout. For faster scheduling, you can also{' '}
        <a href="/book-consultation" className="text-bee-amber font-semibold underline">
          book a live call
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">Request enterprise pilot</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Company / group *</label>
          <input
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Work email *</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Rooftops (approx.)</label>
          <input
            type="number"
            min={1}
            value={rooftops}
            onChange={(e) => setRooftops(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">DMS / inventory source</label>
          <input
            value={dms}
            onChange={(e) => setDms(e.target.value)}
            placeholder="IDS, Lightspeed, CSV…"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1">What success looks like</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm resize-y"
          placeholder="Timeline, brands, CRM handoff needs…"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 rounded-xl bg-bee-amber text-bee-black font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Send inquiry
      </button>
    </form>
  );
}
