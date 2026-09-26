import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send, Truck, DollarSign, MessageCircle } from 'lucide-react';

export type RvMatchResult = {
  id: string;
  name: string;
  fitScore: number;
  reason: string;
  estMonthlyUsd: number;
  msrpUsd: number;
  minTowCapacityLbs: number;
  category: string;
  highlights: string[];
};

type ChatTurn = { role: 'user' | 'assistant'; text: string };

type Props = {
  compact?: boolean;
  partnerLabel?: string;
};

const STARTER_PROMPTS = [
  'Family of 5, bunk beds, under $500/month, half-ton truck',
  'Just retired — Class C, easy to drive, west coast trips',
  'I can tow 5,000 lbs max. Want something lightweight for weekends.',
  'Full-time living on the road, budget around $90k total',
];

export function RvMatcher({ compact, partnerLabel = 'Camping World demo' }: Props) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [matches, setMatches] = useState<RvMatchResult[]>([]);
  const [reply, setReply] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [towingCapacityLbs, setTowingCapacityLbs] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetType, setBudgetType] = useState<'monthly' | 'total'>('monthly');
  const [rvType, setRvType] = useState<'any' | 'towable' | 'motorhome'>('any');

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setLoading(true);
      setError('');
      setMessage('');
      const nextHistory = [...history, { role: 'user', text: trimmed }];
      setHistory(nextHistory);

      try {
        const res = await fetch('/api/rv/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: nextHistory.map((h) => ({
              role: h.role === 'assistant' ? 'assistant' : 'user',
              text: h.text,
            })),
            towingCapacityLbs: towingCapacityLbs ? Number(towingCapacityLbs) : undefined,
            budgetMax: budgetMax ? Number(budgetMax) : undefined,
            budgetType,
            rvType: rvType === 'any' ? undefined : rvType,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Match failed');

        setReply(data.reply || '');
        setMatches(data.matches || []);
        setDisclaimer(data.disclaimer || '');
        setHistory((h) => [...h, { role: 'assistant', text: data.reply || 'Here are some matches.' }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [history, loading, towingCapacityLbs, budgetMax, budgetType, rvType],
  );

  return (
    <div
      className={`grid gap-6 ${compact ? '' : 'lg:grid-cols-[minmax(0,280px)_1fr]'}`}
    >
      {!compact ? (
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-bee-amber">Quick filters</p>
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Truck className="w-3.5 h-3.5" /> Tow capacity (lbs)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 7500"
              value={towingCapacityLbs}
              onChange={(e) => setTowingCapacityLbs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Budget
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setBudgetType('monthly')}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  budgetType === 'monthly'
                    ? 'border-bee-amber text-bee-amber'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                / month
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('total')}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  budgetType === 'total'
                    ? 'border-bee-amber text-bee-amber'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                Total $
              </button>
            </div>
            <input
              type="number"
              min={0}
              placeholder={budgetType === 'monthly' ? 'e.g. 550' : 'e.g. 65000'}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">RV type</label>
            <select
              value={rvType}
              onChange={(e) => setRvType(e.target.value as typeof rvType)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
            >
              <option value="any">Any</option>
              <option value="towable">Towable only</option>
              <option value="motorhome">Motorhome (no tow)</option>
            </select>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Filters apply with your chat. Inventory: <strong className="text-slate-400">{partnerLabel}</strong>.
          </p>
        </aside>
      ) : null}

      <div className="flex flex-col min-h-[420px] rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
          {history.length === 0 ? (
            <div className="text-sm text-slate-400 space-y-3">
              <p className="flex items-center gap-2 text-slate-300">
                <MessageCircle className="w-4 h-4 text-bee-amber" />
                Tell us how you travel — we&apos;ll match demo units from the lot.
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void submit(p)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-white/10 hover:border-bee-amber/40 text-slate-300"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((turn, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed ${
                  turn.role === 'user' ? 'text-white ml-4' : 'text-slate-300 mr-4'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                  {turn.role === 'user' ? 'You' : 'RV guide'}
                </span>
                {turn.text}
              </div>
            ))
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Matching units…
            </div>
          ) : null}
        </div>

        {matches.length > 0 ? (
          <div className="border-t border-white/10 p-4 space-y-3 bg-black/40">
            <p className="text-xs font-semibold text-bee-amber uppercase tracking-wider">Top matches</p>
            <ul className="space-y-2">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
                >
                  <div className="flex justify-between gap-2 mb-1">
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="text-bee-amber text-xs font-bold">{m.fitScore}% fit</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{m.reason}</p>
                  <p className="text-xs text-slate-500">
                    Est. ${m.estMonthlyUsd}/mo · MSRP ${m.msrpUsd.toLocaleString()}
                    {m.minTowCapacityLbs > 0
                      ? ` · Tow ~${m.minTowCapacityLbs.toLocaleString()} lb`
                      : ' · Motorhome'}
                  </p>
                  <Link
                    to={`/rv/inventory#${m.id}`}
                    className="text-[11px] text-bee-amber font-semibold hover:underline inline-block mt-1"
                  >
                    View in demo catalog
                  </Link>
                </li>
              ))}
            </ul>
            {disclaimer ? (
              <p className="text-[10px] text-slate-600">{disclaimer}</p>
            ) : null}
          </div>
        ) : reply && history.length > 0 && !loading ? (
          <div className="border-t border-white/10 p-3 text-xs text-slate-500">{disclaimer}</div>
        ) : null}

        {error ? (
          <div className="px-4 py-2 text-sm text-red-400 bg-red-500/10">{error}</div>
        ) : null}

        <form
          className="border-t border-white/10 p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(message);
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your dream RV, budget, and tow vehicle…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2.5 rounded-xl bg-bee-amber text-bee-black font-bold disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
