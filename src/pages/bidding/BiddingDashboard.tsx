import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { ASSETS, MARKETS, SOURCE_NOTES, marketById } from '../../lib/bidding/assumptions';
import { portfolioRollup, underwrite } from '../../lib/bidding/engine';
import { money, multiple, num, pct, psf } from '../../lib/bidding/format';
import { memoText } from '../../lib/bidding/memo';
import { PRESETS, freshPortfolio } from '../../lib/bidding/presets';
import type { Deal, ExpenseLine, IncomeLine, Phase, Strategy, TradeLine, Underwriting } from '../../lib/bidding/types';

const STORAGE_KEY = 'aibhive.bidding.portfolio.v1';
type Tab = 'overview' | 'income' | 'cost' | 'subs' | 'capital' | 'returns' | 'memo';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Command' },
  { id: 'income', label: 'Rent roll' },
  { id: 'cost', label: 'Cost plan' },
  { id: 'subs', label: 'Sub bids' },
  { id: 'capital', label: 'Capital' },
  { id: 'returns', label: 'Returns' },
  { id: 'memo', label: 'IC memo' },
];

const PHASES: Phase[] = ['IOI', 'Term sheet', 'Best & Final', 'IC memo', 'GMP'];
const STRATEGIES: Strategy[] = ['acquire', 'value-add', 'ground-up', 'tenant-improvement'];

function loadPortfolio(): { activeId: string; deals: Deal[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshPortfolio();
    const parsed = JSON.parse(raw) as { activeId?: string; deals?: Deal[] };
    if (!parsed.deals?.length || !parsed.deals.every((deal) => deal.id && deal.trades?.length && deal.income?.length)) {
      return freshPortfolio();
    }
    return { activeId: parsed.activeId || parsed.deals[0].id, deals: parsed.deals };
  } catch {
    return freshPortfolio();
  }
}

function verdictClass(verdict: Underwriting['verdict']): string {
  if (verdict === 'BID') return 'bg-emerald-400 text-emerald-950';
  if (verdict === 'STRETCH') return 'bg-amber-300 text-amber-950';
  return 'bg-rose-400 text-rose-950';
}

function ScoreRing({ score, verdict }: { score: number; verdict: Underwriting['verdict'] }) {
  const color = verdict === 'BID' ? '#34d399' : verdict === 'STRETCH' ? '#fbbf24' : '#fb7185';
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
      <circle cx="44" cy="44" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        stroke={color}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${(circ * score) / 100} ${circ}`}
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3">
        <input
          className="w-full min-w-0 bg-transparent py-2 text-sm text-white outline-none tabular-nums"
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <span className="shrink-0 text-[11px] text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function PctField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label} suffix="%" step={0.1} value={Math.round(value * 1000) / 10} onChange={(next) => onChange(next / 100)} />;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function CapitalStack({ u }: { u: Underwriting }) {
  const layers = [
    { label: 'Equity', amount: Math.max(0, u.equity), className: 'bg-amber-400 text-amber-950' },
    { label: 'Mezzanine', amount: u.mezz, className: 'bg-stone-300 text-stone-900' },
    { label: 'Senior debt', amount: u.senior, className: 'bg-stone-700 text-stone-100' },
  ].filter((layer) => layer.amount > 1);
  const total = layers.reduce((sum, layer) => sum + layer.amount, 0) || 1;
  return (
    <div className="flex h-80 flex-col-reverse overflow-hidden rounded-3xl border border-amber-400/25">
      {layers.map((layer) => (
        <div
          key={layer.label}
          className={`flex items-center justify-between px-5 ${layer.className}`}
          style={{ flex: Math.max(layer.amount / total, 0.12) }}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Capital stack</div>
            <div className="text-lg font-semibold">{layer.label}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">{money(layer.amount)}</div>
            <div className="text-xs opacity-80">{pct(layer.amount / total)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BidPath({ phase }: { phase: Phase }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {PHASES.map((item, index) => {
        const active = item === phase;
        const done = PHASES.indexOf(phase) > index;
        return (
          <li
            key={item}
            className={`rounded-2xl border px-3 py-4 ${
              active ? 'border-amber-300 bg-amber-400 text-amber-950' : done ? 'border-white/15 bg-white/10 text-white' : 'border-white/10 text-slate-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">0{index + 1}</div>
            <div className="mt-1 text-sm font-semibold">{item}</div>
          </li>
        );
      })}
    </ol>
  );
}

export default function BiddingDashboard() {
  const [portfolio, setPortfolio] = useState(freshPortfolio);
  const [tab, setTab] = useState<Tab>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPortfolio(loadPortfolio());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio, ready]);

  const books = useMemo(
    () => portfolio.deals.map((deal) => ({ deal, u: underwrite(deal) })),
    [portfolio],
  );
  const roll = useMemo(() => portfolioRollup(books), [books]);
  const active = books.find((book) => book.deal.id === portfolio.activeId) ?? books[0];
  const deal = active.deal;
  const u = active.u;

  const update = (fn: (current: Deal) => Deal) => {
    setPortfolio((current) => ({
      ...current,
      deals: current.deals.map((item) => (item.id === current.activeId ? fn(item) : item)),
    }));
  };
  const set = (patch: Partial<Deal>) => update((current) => ({ ...current, ...patch }));

  const sf = deal.rentableSf > 0 ? deal.rentableSf : 1;
  const gap = deal.askingPrice - deal.purchasePrice;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100">
      <SEO
        title="CRE Bid Desk — Costs, Subs, and Cash-on-Cash | AiBhive"
        description="Institutional commercial real estate bidding desk: construction cost plan, subcontractor quotes, materials, debt, and cash-on-cash returns for a billion-dollar pipeline."
        keywords="commercial real estate bidding, cash on cash return, construction bid, cap rate, DSCR, yield on cost, AiBhive"
        type="WebApplication"
      />
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#08090d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-black tracking-tight text-white">
              Ai<span className="text-amber-400">B</span>Hive
            </Link>
            <span className="hidden text-slate-600 sm:inline">/</span>
            <span className="text-sm font-semibold text-amber-200">Bid Desk</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden md:inline">Pipeline basis {money(roll.totalCost)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${verdictClass(u.verdict)}`}>{u.verdict}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="no-print space-y-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Live pipeline</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{money(roll.totalCost)}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Four open jobs. Equity {money(roll.equity)}. Stabilized NOI {money(roll.noi)}. Blended year-1 cash-on-cash {pct(roll.cashOnCash)}.
            </p>
          </div>
          {books.map((book) => (
            <button
              key={book.deal.id}
              type="button"
              onClick={() => setPortfolio((current) => ({ ...current, activeId: book.deal.id }))}
              className={`w-full overflow-hidden rounded-3xl border text-left ${
                book.deal.id === deal.id ? 'border-amber-300/70' : 'border-white/10'
              }`}
            >
              <img src={book.deal.image} alt="" className="h-28 w-full object-cover" />
              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{book.deal.phase}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${verdictClass(book.u.verdict)}`}>{book.u.verdict}</span>
                </div>
                <div className="font-semibold text-white">{book.deal.name}</div>
                <div className="text-xs text-slate-400">
                  {book.deal.jobCode} · {money(book.u.totalCost)} basis
                </div>
              </div>
            </button>
          ))}
          <button
            type="button"
            className="w-full rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-400"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setPortfolio(freshPortfolio());
            }}
          >
            Reset sample pipeline
          </button>
        </aside>

        <main className="min-w-0 space-y-6">
          <section className="no-print relative overflow-hidden rounded-[28px] border border-white/10">
            <img src="/bidding/bidding-command-hero.jpg" alt="Institutional bidding room overlooking a skyline and logistics campus" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/88 to-[#08090d]/25" />
            <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">Commercial real estate command</p>
                <h1 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">Bid the job. Price the stack. See the cash.</h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                  Same desk a sponsor uses on a billion-dollar pipeline: rent roll, CSI cost plan, subcontractor spread, materials, debt, and cash-on-cash. Every figure on this page is calculated from the job you are editing.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 self-end text-sm">
                <Kpi label="Pipeline basis" value={money(roll.totalCost)} />
                <Kpi label="Pipeline NOI" value={money(roll.noi)} />
                <Kpi label="Equity required" value={money(roll.equity)} />
                <Kpi label="Blended CoC" value={pct(roll.cashOnCash)} />
              </div>
            </div>
          </section>

          <nav className="no-print flex gap-2 overflow-x-auto">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === item.id ? 'bg-amber-400 text-amber-950' : 'bg-white/5 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <img src={deal.image} alt="" className="h-40 w-full rounded-3xl object-cover md:h-full" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  {deal.jobCode} · {deal.phase}
                </div>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">{deal.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {deal.address} · {ASSETS[deal.assetId].label} · {marketById(deal.marketId).name} · {num(deal.rentableSf)} SF
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{deal.notes}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={u.score} verdict={u.verdict} />
                <div>
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${verdictClass(u.verdict)}`}>{u.verdict}</div>
                  <div className="mt-2 text-xs text-slate-400">Tightest test: {u.binding ?? '—'}</div>
                  <div className="text-sm font-semibold text-white">Ceiling {money(u.maxBid)}</div>
                </div>
              </div>
            </div>
          </section>

          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Draft bid" value={money(deal.purchasePrice)} hint={psf(deal.purchasePrice / sf)} />
                <Kpi label="Total basis" value={money(u.totalCost)} hint={`${psf(u.totalCost / sf)} all-in`} />
                <Kpi
                  label="Stabilized NOI"
                  value={money(u.stabilized.noi)}
                  hint={
                    deal.strategy === 'ground-up'
                      ? `Yield on cost ${pct(u.yieldOnCost)} · land is not a cap rate`
                      : `Cap ${pct(u.stabilizedCap)} · YoC ${pct(u.yieldOnCost)}`
                  }
                />
                <Kpi label="Year-1 cash-on-cash" value={pct(u.cashOnCash)} hint={`DSCR ${multiple(u.dscr)} · Debt yield ${pct(u.debtYield)}`} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Job name" value={deal.name} onChange={(name) => set({ name })} />
                <TextField label="Address" value={deal.address} onChange={(address) => set({ address })} />
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Market</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    value={deal.marketId}
                    onChange={(event) => set({ marketId: event.target.value })}
                  >
                    {MARKETS.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name} · {market.factor.toFixed(2)}x
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Strategy</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm capitalize"
                    value={deal.strategy}
                    onChange={(event) => set({ strategy: event.target.value as Strategy })}
                  >
                    {STRATEGIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Rentable SF" value={deal.rentableSf} onChange={(rentableSf) => set({ rentableSf })} />
                <Field label="Units / buildings" value={deal.units} onChange={(units) => set({ units })} />
                <Field label="Asking price" value={deal.askingPrice} onChange={(askingPrice) => set({ askingPrice })} />
                <Field label="Our bid / land basis" value={deal.purchasePrice} onChange={(purchasePrice) => set({ purchasePrice })} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={u.maxBid == null}
                  onClick={() => u.maxBid != null && set({ purchasePrice: Math.round(u.maxBid) })}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-amber-950 disabled:opacity-40"
                >
                  Price at the ceiling
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200"
                  onClick={() => {
                    const fresh = PRESETS.find((item) => item.id === deal.id);
                    if (fresh) update(() => structuredClone(fresh));
                  }}
                >
                  Restore this sample
                </button>
                <span className="text-sm text-slate-400">
                  {gap >= 0 ? `${money(gap)} inside the ask` : `${money(Math.abs(gap))} through the ask`} · {psf(u.hardPerSf)} hard
                </span>
              </div>

              <ul className="grid gap-2 md:grid-cols-2">
                {u.reasons.map((reason) => (
                  <li key={reason} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                    {reason}
                  </li>
                ))}
              </ul>
              {u.warnings.length > 0 && (
                <ul className="space-y-2">
                  {u.warnings.map((warning) => (
                    <li key={warning} className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                      {warning}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Live capital stack</h3>
                  <CapitalStack u={u} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Bid path</h3>
                  <BidPath phase={deal.phase} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {u.uses.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
                        <div className="font-semibold tabular-nums">{money(item.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <figure className="overflow-hidden rounded-[28px] border border-white/10">
                <img src="/bidding/bidding-trades.jpg" alt="Trade map covering structure, envelope, interiors, HVAC, electrical, plumbing, fire, and site" className="max-h-[420px] w-full object-cover" />
                <figcaption className="px-5 py-4 text-sm text-slate-400">
                  Trade map for the cost plan. This job’s live split is labor {money(u.labor)}, materials {money(u.materials)}, equipment {money(u.equipment)}, waste {money(u.wasteDollars)}, and material sales tax {money(u.materialTax)}.
                </figcaption>
              </figure>
            </div>
          )}

          {tab === 'income' && (
            <div className="grid gap-6 xl:grid-cols-2">
              <IncomeEditor
                title="Stabilized income"
                lines={deal.income}
                onChange={(income) => set({ income })}
                sf={sf}
                units={deal.units}
              />
              <ExpenseEditor lines={deal.expenses} onChange={(expenses) => set({ expenses })} />
              <div className="space-y-3 rounded-3xl border border-white/10 p-4 xl:col-span-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PctField label="Stabilized vacancy" value={deal.vacancy} onChange={(vacancy) => set({ vacancy })} />
                  <PctField label="In-place vacancy" value={deal.inPlaceVacancy} onChange={(inPlaceVacancy) => set({ inPlaceVacancy })} />
                  <PctField label="Credit loss" value={deal.creditLoss} onChange={(creditLoss) => set({ creditLoss })} />
                  <Field label="In-place rent / year" value={deal.inPlaceRent} step={0.05} suffix={deal.rentBasis === 'unit' ? '/unit' : '/SF'} onChange={(inPlaceRent) => set({ inPlaceRent })} />
                  <Field label="In-place other income" value={deal.inPlaceOther} onChange={(inPlaceOther) => set({ inPlaceOther })} />
                  <Field label="Reserves / SF" value={deal.reservesPerSf} step={0.01} onChange={(reservesPerSf) => set({ reservesPerSf })} />
                  <Field label="Reserves / unit" value={deal.reservesPerUnit} onChange={(reservesPerUnit) => set({ reservesPerUnit })} />
                </div>
                <OpsTable title="Stabilized" ops={u.stabilized} />
                <OpsTable title="In place" ops={u.inPlace} />
              </div>
            </div>
          )}

          {tab === 'cost' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Kpi label="Direct trades" value={money(u.directCost)} />
                <Kpi label="Contractor bid" value={money(u.contractorBid)} />
                <Kpi label="Owner hard cost" value={money(u.ownerHard)} hint={psf(u.hardPerSf)} />
                <Kpi label="Scope band" value={`${psf(deal.scopeLow)}–${psf(deal.scopeHigh)}`} hint={deal.scopeName} />
              </div>
              <p className="text-sm text-slate-400">
                Location index {u.locationFactor.toFixed(2)} × quality {u.qualityFactor.toFixed(2)}. Ground-up context for this asset is {psf(deal.groundLow)}–{psf(deal.groundHigh)} nationally before that index. {ASSETS[deal.assetId].source}.
              </p>
              <div className="overflow-x-auto rounded-3xl border border-white/10">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="px-3 py-3">CSI</th>
                      <th>Trade</th>
                      <th>Qty</th>
                      <th>Unit cost</th>
                      <th>Total</th>
                      <th>Labor</th>
                      <th>Material</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.lines.map((line) => {
                      const source = deal.trades.find((trade) => trade.id === line.id);
                      if (!source) return null;
                      return (
                        <tr key={line.id} className="border-t border-white/5">
                          <td className="px-3 py-2 text-slate-500">{line.csi}</td>
                          <td>
                            <div className="font-medium text-white">{line.trade}</div>
                            <div className="max-w-xs text-xs text-slate-500">{line.scope}</div>
                          </td>
                          <td>
                            <input
                              className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 tabular-nums"
                              type="number"
                              value={source.qty}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  trades: current.trades.map((trade) =>
                                    trade.id === line.id ? { ...trade, qty: Number(event.target.value) } : trade,
                                  ),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="w-28 rounded-lg border border-white/10 bg-black/40 px-2 py-1 tabular-nums"
                              type="number"
                              step="0.01"
                              value={Math.round(source.unitCost * 100) / 100}
                              onChange={(event) =>
                                update((current) => ({
                                  ...current,
                                  trades: current.trades.map((trade) =>
                                    trade.id === line.id ? { ...trade, unitCost: Number(event.target.value) } : trade,
                                  ),
                                }))
                              }
                            />
                          </td>
                          <td className="tabular-nums">{money(line.total, 'full')}</td>
                          <td className="tabular-nums text-slate-400">{money(line.labor)}</td>
                          <td className="tabular-nums text-slate-400">{money(line.material)}</td>
                          <td className="pr-3 text-xs text-slate-400">{line.source === 'sub' ? line.subName : 'In-house estimate'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {u.stack.map((step) => (
                  <div key={step.name} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-2 text-sm">
                    <span>
                      {step.name} <span className="text-slate-500">{pct(step.pct)}</span>
                    </span>
                    <span className="tabular-nums">{money(step.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'subs' && (
            <div className="space-y-5">
              <p className="text-sm text-slate-400">
                Three illustrative quotes sit under each trade: low, level with the estimate, and a schedule premium. Pick one to lock it into the cost plan. Typing a dollar amount freezes that quote so the market index no longer moves it.
              </p>
              {deal.trades.map((trade) => (
                <SubBoard
                  key={trade.id}
                  trade={trade}
                  onChange={(next) =>
                    update((current) => ({
                      ...current,
                      trades: current.trades.map((item) => (item.id === trade.id ? next : item)),
                    }))
                  }
                />
              ))}
            </div>
          )}

          {tab === 'capital' && (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <PctField label="Senior LTC" value={deal.seniorLtc} onChange={(seniorLtc) => set({ seniorLtc })} />
                <PctField label="Mezz LTC" value={deal.mezzLtc} onChange={(mezzLtc) => set({ mezzLtc })} />
                <PctField label="Senior rate" value={deal.interestRate} onChange={(interestRate) => set({ interestRate })} />
                <PctField label="Mezz rate" value={deal.mezzRate} onChange={(mezzRate) => set({ mezzRate })} />
                <Field label="Amortization years" value={deal.amortYears} onChange={(amortYears) => set({ amortYears })} />
                <Field label="Interest-only years" value={deal.ioYears} onChange={(ioYears) => set({ ioYears })} />
                <PctField label="Senior points" value={deal.points} onChange={(points) => set({ points })} />
                <Field label="Interest reserve months" value={deal.reserveMonths} onChange={(reserveMonths) => set({ reserveMonths })} />
                <Field label="Hold years" value={deal.holdYears} onChange={(holdYears) => set({ holdYears })} />
                <PctField label="Exit cap" value={deal.exitCap} onChange={(exitCap) => set({ exitCap })} />
                <PctField label="Rent growth" value={deal.rentGrowth} onChange={(rentGrowth) => set({ rentGrowth })} />
                <PctField label="Selling cost" value={deal.sellingCostPct} onChange={(sellingCostPct) => set({ sellingCostPct })} />
                <PctField label="Closing cost" value={deal.closingPct} onChange={(closingPct) => set({ closingPct })} />
                <PctField label="A/E" value={deal.architecturePct} onChange={(architecturePct) => set({ architecturePct })} />
                <PctField label="Permits" value={deal.permitsPct} onChange={(permitsPct) => set({ permitsPct })} />
                <PctField label="Developer fee" value={deal.developerFeePct} onChange={(developerFeePct) => set({ developerFeePct })} />
                <Field label="FF&E" value={deal.ffe} onChange={(ffe) => set({ ffe })} />
                <PctField label="Material sales tax" value={deal.materialSalesTax} onChange={(materialSalesTax) => set({ materialSalesTax })} />
                <PctField label="Target cash-on-cash" value={deal.targetCashOnCash} onChange={(targetCashOnCash) => set({ targetCashOnCash })} />
                <PctField label="Target cap rate" value={deal.targetCapRate} onChange={(targetCapRate) => set({ targetCapRate })} />
                <Field label="Target DSCR" value={deal.targetDscr} step={0.05} suffix="x" onChange={(targetDscr) => set({ targetDscr })} />
                <PctField label="Min debt yield" value={deal.minDebtYield} onChange={(minDebtYield) => set({ minDebtYield })} />
                <PctField label="YoC spread over exit" value={deal.yocSpread} onChange={(yocSpread) => set({ yocSpread })} />
              </div>
              <div className="space-y-3">
                <CapitalStack u={u} />
                <div className="rounded-3xl border border-white/10 p-4 text-sm">
                  <Row label="Senior loan" value={money(u.senior)} />
                  <Row label="Mezzanine" value={money(u.mezz)} />
                  <Row label="Equity" value={money(u.equity)} />
                  <Row label="Points" value={money(u.pointsDollars)} />
                  <Row label="Interest reserve" value={money(u.interestReserve)} />
                  <Row label="Year-1 debt service" value={money(u.year1DebtService)} />
                  <Row label="Takeout debt service" value={money(u.takeoutDebtService)} />
                </div>
              </div>
            </div>
          )}

          {tab === 'returns' && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Year-1 cash-on-cash" value={pct(u.cashOnCash)} hint={`Hurdle ${pct(deal.targetCashOnCash)}`} />
                <Kpi label="Permanent cash-on-cash" value={pct(u.permanentCashOnCash)} hint="After interest-only ends" />
                <Kpi label="Takeout DSCR" value={multiple(u.dscr)} hint={`+100 bps ${multiple(u.rateShockDscr)}`} />
                <Kpi label="Levered IRR" value={pct(u.irr)} hint={`Equity multiple ${multiple(u.equityMultiple)}`} />
                <Kpi label={deal.strategy === 'ground-up' ? 'Cap rate on land' : 'Going-in cap'} value={deal.strategy === 'ground-up' ? 'n/a' : pct(u.goingInCap)} hint={deal.strategy === 'ground-up' ? 'Use yield on cost' : undefined} />
                <Kpi label={deal.strategy === 'ground-up' ? 'Spread vs exit' : 'Stabilized cap'} value={deal.strategy === 'ground-up' ? (u.spreadBps != null ? `${Math.round(u.spreadBps)} bps` : '—') : pct(u.stabilizedCap)} />
                <Kpi label="Yield on cost" value={pct(u.yieldOnCost)} hint={u.spreadBps != null ? `${Math.round(u.spreadBps)} bps vs exit` : undefined} />
                <Kpi label="Exit value" value={money(u.exitValue)} hint={`Net to equity ${money(u.netSaleProceeds)}`} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Rent versus hard-cost stress</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="py-2 text-left">Rent</th>
                        {[1, 1.08, 1.15].map((scale) => (
                          <th key={scale} className="py-2 text-left">
                            Cost {scale === 1 ? 'base' : `+${Math.round((scale - 1) * 100)}%`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[0.9, 0.95, 1, 1.05, 1.1].map((rentScale) => (
                        <tr key={rentScale} className="border-t border-white/5">
                          <td className="py-2 text-slate-400">{rentScale === 1 ? 'Base rent' : `${rentScale > 1 ? '+' : ''}${Math.round((rentScale - 1) * 100)}%`}</td>
                          {[1, 1.08, 1.15].map((hardScale) => {
                            const cell = u.sensitivity.find((item) => item.rentScale === rentScale && item.hardScale === hardScale);
                            return (
                              <td key={hardScale} className="py-2 tabular-nums">
                                {pct(cell?.cashOnCash)} · {multiple(cell?.dscr)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="py-2">Year</th>
                      <th>NOI</th>
                      <th>Debt service</th>
                      <th>Cash flow</th>
                      <th>Sale proceeds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.cashFlows.map((year) => (
                      <tr key={year.year} className="border-t border-white/5">
                        <td className="py-2">{year.year}</td>
                        <td className="tabular-nums">{money(year.noi)}</td>
                        <td className="tabular-nums">{money(year.debtService)}</td>
                        <td className="tabular-nums">{money(year.cashFlow)}</td>
                        <td className="tabular-nums">{year.saleProceeds ? money(year.saleProceeds) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'memo' && (
            <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="no-print mb-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-amber-950"
                  onClick={() => navigator.clipboard.writeText(memoText(deal, u))}
                >
                  Copy memo
                </button>
                <button type="button" className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => window.print()}>
                  Print
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">{memoText(deal, u)}</pre>
            </article>
          )}

          <details className="no-print rounded-3xl border border-white/10 px-5 py-4 text-sm text-slate-400">
            <summary className="cursor-pointer font-semibold text-slate-200">Where the benchmarks come from</summary>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {SOURCE_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-3">
              Sample subcontractor names are not live bids. Replace them on the Sub bids tab before an IC memo leaves the building.
            </p>
          </details>
        </main>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

function OpsTable({ title, ops }: { title: string; ops: Underwriting['stabilized'] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-4 text-sm">
        <Kpi label="GPR" value={money(ops.gpr)} />
        <Kpi label="EGI" value={money(ops.egi)} />
        <Kpi label="Operating expenses" value={money(ops.opex)} />
        <Kpi label="NOI" value={money(ops.noi)} />
      </div>
    </div>
  );
}

function IncomeEditor({
  title,
  lines,
  onChange,
  sf,
  units,
}: {
  title: string;
  lines: IncomeLine[];
  onChange: (lines: IncomeLine[]) => void;
  sf: number;
  units: number;
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 p-4">
      <h3 className="font-semibold">{title}</h3>
      {lines.map((line) => (
        <div key={line.id} className="grid grid-cols-[1fr_120px_90px] gap-2">
          <TextField label="Line" value={line.label} onChange={(label) => onChange(lines.map((item) => (item.id === line.id ? { ...item, label } : item)))} />
          <Field
            label={line.basis === 'sf' ? '$ / SF' : line.basis === 'unit' ? '$ / unit' : 'Annual $'}
            value={line.amount}
            step={0.05}
            onChange={(amount) => onChange(lines.map((item) => (item.id === line.id ? { ...item, amount } : item)))}
          />
          <div className="text-xs text-slate-500 self-end pb-2">
            {money(line.basis === 'sf' ? line.amount * sf : line.basis === 'unit' ? line.amount * units : line.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpenseEditor({ lines, onChange }: { lines: ExpenseLine[]; onChange: (lines: ExpenseLine[]) => void }) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 p-4">
      <h3 className="font-semibold">Operating expenses</h3>
      {lines.map((line) => (
        <div key={line.id} className="grid grid-cols-2 gap-2">
          <TextField label={line.basis} value={line.label} onChange={(label) => onChange(lines.map((item) => (item.id === line.id ? { ...item, label } : item)))} />
          <Field
            label={line.basis === 'egi' || line.basis === 'price' || line.basis === 'cost' ? 'Rate %' : 'Amount'}
            value={line.basis === 'egi' || line.basis === 'price' || line.basis === 'cost' ? Math.round(line.amount * 1000) / 10 : line.amount}
            step={0.05}
            suffix={line.basis === 'egi' || line.basis === 'price' || line.basis === 'cost' ? '%' : undefined}
            onChange={(amount) =>
              onChange(
                lines.map((item) =>
                  item.id === line.id
                    ? {
                        ...item,
                        amount: item.basis === 'egi' || item.basis === 'price' || item.basis === 'cost' ? amount / 100 : amount,
                      }
                    : item,
                ),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

function SubBoard({ trade, onChange }: { trade: TradeLine; onChange: (trade: TradeLine) => void }) {
  return (
    <section className="rounded-3xl border border-white/10 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{trade.csi}</div>
          <h3 className="text-lg font-semibold">{trade.trade}</h3>
          <p className="text-xs text-slate-500">{trade.scope}</p>
        </div>
        <button
          type="button"
          className="text-xs text-slate-400 underline"
          onClick={() => onChange({ ...trade, bids: trade.bids.map((bid) => ({ ...bid, selected: false })) })}
        >
          Use in-house estimate
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {trade.bids.map((bid, index) => (
          <div key={bid.company + index} className={`rounded-2xl border p-3 ${bid.selected ? 'border-amber-300 bg-amber-400/10' : 'border-white/10'}`}>
            <input
              className="w-full bg-transparent font-semibold outline-none"
              value={bid.company}
              onChange={(event) =>
                onChange({
                  ...trade,
                  bids: trade.bids.map((item, itemIndex) => (itemIndex === index ? { ...item, company: event.target.value } : item)),
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">{bid.exclusions}</p>
            <label className="mt-3 block text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Lump sum
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm"
                type="number"
                placeholder={bid.linked ? 'Linked to estimate' : ''}
                value={bid.amount ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  onChange({
                    ...trade,
                    bids: trade.bids.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, amount: raw === '' ? null : Number(raw), linked: raw === '' }
                        : item,
                    ),
                  });
                }}
              />
            </label>
            <div className="mt-2 text-xs text-slate-500">{bid.days} days · factor {bid.factor.toFixed(2)} when linked</div>
            <button
              type="button"
              className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
              onClick={() =>
                onChange({
                  ...trade,
                  bids: trade.bids.map((item, itemIndex) => ({ ...item, selected: itemIndex === index ? !item.selected : false })),
                })
              }
            >
              {bid.selected ? 'Selected' : 'Use this bid'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
