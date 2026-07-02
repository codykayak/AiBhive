import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Copy,
  Hammer,
  Home,
  RotateCcw,
  Share2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  DEFAULT_FLIP,
  FLIP_PRESETS,
  arvSensitivity,
  costBreakdown,
  dealScore,
  flipQuip,
  formatUsd,
  loadFlipDeals,
  maxOffer70Rule,
  netProfit,
  roiPct,
  saveFlipDeal,
  shareFlipText,
  totalCashIn,
  type FlipDeal,
  type FlipInputs,
} from '../../lib/houseFlipCalc';

type Props = { expanded?: boolean };

function num(v: string, fallback = 0): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

/** House flip deal analyzer — live profit, charts, deal score reactor. */
export default function HouseFlipCalculatorWebApp({ expanded }: Props) {
  const brand = brandFor('amber');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(50);
  const pulseRef = useRef(0);

  const [inputs, setInputs] = useState<FlipInputs>(DEFAULT_FLIP);
  const [history, setHistory] = useState<FlipDeal[]>(() => loadFlipDeals());
  const [copied, setCopied] = useState(false);

  const profit = useMemo(() => netProfit(inputs), [inputs]);
  const roi = useMemo(() => roiPct(inputs), [inputs]);
  const invested = useMemo(() => totalCashIn(inputs), [inputs]);
  const score = useMemo(() => dealScore(inputs), [inputs]);
  const quip = useMemo(() => flipQuip(inputs), [inputs]);
  const breakdown = useMemo(() => costBreakdown(inputs), [inputs]);
  const sensitivity = useMemo(() => arvSensitivity(inputs), [inputs]);
  const maxOffer = useMemo(() => maxOffer70Rule(inputs), [inputs]);

  scoreRef.current = score;

  const setField = <K extends keyof FlipInputs>(key: K, value: FlipInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (id: string) => {
    const preset = FLIP_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setInputs((prev) => ({
      ...prev,
      rehabBudget: preset.rehab,
      holdingMonths: preset.holding,
    }));
  };

  const reset = () => setInputs(DEFAULT_FLIP);

  const saveDeal = () => setHistory(saveFlipDeal(inputs));

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareFlipText(inputs));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.38;
      pulseRef.current += 0.035;
      const s = scoreRef.current / 100;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.fillRect(0, 0, w, h);

      for (let ring = 4; ring >= 1; ring--) {
        const r = (maxR * ring) / 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.06 + ring * 0.05})`;
        ctx.lineWidth = ring === 1 ? 2 : 1;
        ctx.stroke();
      }

      const sweep = pulseRef.current * 1.4;
      for (let i = 0; i < 24; i++) {
        const a = sweep + (i / 24) * Math.PI * 2;
        const dist = maxR * (0.35 + (i % 5) * 0.1 + Math.sin(pulseRef.current + i) * 0.04);
        const px = cx + Math.cos(a) * dist;
        const py = cy + Math.sin(a) * dist;
        const hue = profit > 0 ? 38 + i * 2 : 0 + i;
        ctx.beginPath();
        ctx.arc(px, py, 2 + s * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${0.35 + s * 0.4})`;
        ctx.fill();
      }

      const arcEnd = -Math.PI / 2 + Math.PI * 2 * s;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.72, -Math.PI / 2, arcEnd);
      ctx.strokeStyle = profit >= 0 ? 'rgba(251, 191, 36, 0.95)' : 'rgba(248, 113, 113, 0.95)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      const corePulse = 1 + Math.sin(pulseRef.current * 2) * 0.12;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.35 * corePulse);
      grad.addColorStop(0, profit >= 0 ? 'rgba(251, 191, 36, 0.55)' : 'rgba(248, 113, 113, 0.45)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.35 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [profit]);

  const loadDeal = useCallback((deal: FlipDeal) => {
    setInputs({
      label: deal.label,
      purchasePrice: deal.purchasePrice,
      arv: deal.arv,
      rehabBudget: deal.rehabBudget,
      holdingMonths: deal.holdingMonths,
      holdingCostPerMonth: deal.holdingCostPerMonth,
      buyClosingPct: deal.buyClosingPct,
      sellClosingPct: deal.sellClosingPct,
    });
  }, []);

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden ${expanded ? 'min-h-[calc(100vh-12rem)]' : ''}`}
      style={{ borderColor: brand.primary + '44', backgroundColor: '#0b0f14' }}
    >
      <div
        className="flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: brand.primary + '33', backgroundColor: brand.primary + '14' }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: brand.primary + '33' }}
        >
          <Home className="h-6 w-6" style={{ color: brand.primary }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primary }}>
            House Flip Calculator
          </p>
          <h2 className="text-lg font-black text-white">Deal profit reactor</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            ARV, rehab, holding costs — live profit, ROI charts, and 70% rule max offer.
          </p>
        </div>
      </div>

      <div className={`flex-1 space-y-5 overflow-y-auto p-5 ${expanded ? 'md:p-8' : ''}`}>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div
            className="relative overflow-hidden rounded-2xl border p-6 text-center"
            style={{ borderColor: brand.primary + '44', backgroundColor: 'rgba(0,0,0,0.35)' }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${profit >= 0 ? brand.primary : '#f87171'}, transparent 65%)`,
              }}
            />
            <p className="relative text-xs font-bold uppercase tracking-widest text-slate-500">
              Net profit
            </p>
            <p
              className="relative mt-1 text-5xl font-black tabular-nums sm:text-6xl"
              style={{ color: profit >= 0 ? brand.primaryText : '#fca5a5' }}
            >
              {formatUsd(profit)}
            </p>
            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                {roi.toFixed(1)}% ROI
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                {formatUsd(invested)} in
              </span>
            </div>
            {quip ? <p className="relative mt-3 text-sm italic text-slate-300">{quip}</p> : null}
          </div>

          <div className="relative aspect-[4/3] min-h-[200px] overflow-hidden rounded-2xl border border-amber-500/25 bg-slate-950">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300/70">
                Deal score
              </p>
              <p className="font-mono text-4xl font-black text-white">{Math.round(score)}</p>
              <p className="mt-1 text-xs text-slate-400">Max offer ~{formatUsd(maxOffer)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FLIP_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
            >
              <Hammer className="mr-1 inline h-3.5 w-3.5" />
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => void copyShare()}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
          >
            {copied ? <Copy className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            type="button"
            onClick={saveDeal}
            className="rounded-xl px-3 py-2 text-xs font-extrabold"
            style={{ backgroundColor: brand.primary, color: brand.contrastText }}
          >
            Save deal
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['label', 'Deal name', 'text', inputs.label],
              ['purchasePrice', 'Purchase price', 'number', inputs.purchasePrice],
              ['arv', 'ARV (after repair)', 'number', inputs.arv],
              ['rehabBudget', 'Rehab budget', 'number', inputs.rehabBudget],
              ['holdingMonths', 'Holding months', 'number', inputs.holdingMonths],
              ['holdingCostPerMonth', 'Holding $/mo', 'number', inputs.holdingCostPerMonth],
              ['buyClosingPct', 'Buy closing %', 'number', inputs.buyClosingPct],
              ['sellClosingPct', 'Sell closing %', 'number', inputs.sellClosingPct],
            ] as const
          ).map(([key, label, kind, val]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </span>
              <input
                type={kind}
                value={val}
                onChange={(e) =>
                  setField(
                    key,
                    (kind === 'text' ? e.target.value : num(e.target.value, 0)) as FlipInputs[typeof key]
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-3 text-sm font-bold text-white">Cost stack</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(v: number) => formatUsd(v)}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {breakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-3 text-sm font-bold text-white">Cash allocation</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {breakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(v: number) => formatUsd(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="mb-3 text-sm font-bold text-white">ARV sensitivity — what if comps move?</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivity} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(v: number) => formatUsd(v)}
                />
                <Line type="monotone" dataKey="profit" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-bold text-slate-400">Saved deals</p>
            <div className="space-y-2">
              {history.map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => loadDeal(deal)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
                >
                  <span className="font-semibold text-white">{deal.label}</span>
                  <span className="font-mono text-sm text-amber-300">{formatUsd(netProfit(deal))}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
