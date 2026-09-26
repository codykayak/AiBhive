import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatRvCategory,
  RV_DEMO_DISCLAIMER,
  RV_DEMO_UNITS,
  type RvDemoUnit,
} from '../../content/rvCampingWorldDemo';

type Props = {
  compact?: boolean;
  highlightId?: string;
};

export function RvInventoryGrid({ compact, highlightId }: Props) {
  const [category, setCategory] = useState<string>('all');
  const [maxMonthly, setMaxMonthly] = useState('');
  const [minTow, setMinTow] = useState('');

  const filtered = useMemo(() => {
    let list: RvDemoUnit[] = [...RV_DEMO_UNITS];
    if (category !== 'all') list = list.filter((u) => u.category === category);
    const monthly = Number(maxMonthly);
    if (monthly > 0) list = list.filter((u) => u.estMonthlyUsd <= monthly);
    const tow = Number(minTow);
    if (tow > 0) {
      list = list.filter((u) => u.minTowCapacityLbs === 0 || u.minTowCapacityLbs <= tow);
    }
    return list;
  }, [category, maxMonthly, minTow]);

  const categories = [...new Set(RV_DEMO_UNITS.map((u) => u.category))];

  return (
    <div>
      {!compact ? (
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          >
            <option value="all">All types</option>
            {categories.map((c) => (
              <option key={c} value={c}>{formatRvCategory(c)}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Max $/mo"
            value={maxMonthly}
            onChange={(e) => setMaxMonthly(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm w-32"
          />
          <input
            type="number"
            placeholder="Your tow lbs"
            value={minTow}
            onChange={(e) => setMinTow(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm w-36"
          />
          <Link
            to="/rv/demo"
            className="ml-auto text-sm text-bee-amber font-semibold hover:underline self-center"
          >
            Open AI matcher →
          </Link>
        </div>
      ) : null}

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {filtered.map((unit) => (
          <article
            key={unit.id}
            id={unit.id}
            className={`rounded-xl border p-4 flex flex-col ${
              highlightId === unit.id
                ? 'border-bee-amber/50 bg-bee-amber/5'
                : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-emerald-400/90 mb-1">
              {formatRvCategory(unit.category)} · {unit.year}
            </p>
            <h3 className="font-bold text-white text-sm mb-2 leading-snug">{unit.name}</h3>
            <p className="text-xs text-slate-400 mb-3 flex-grow">
              Sleeps {unit.sleeps} · {unit.lengthFt}&apos; · {unit.dryWeightLbs.toLocaleString()} lb dry
            </p>
            <p className="text-sm text-white font-semibold mb-1">
              Est. ${unit.estMonthlyUsd}/mo
              <span className="text-slate-500 font-normal text-xs ml-2">
                MSRP ${unit.msrpUsd.toLocaleString()}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              {unit.minTowCapacityLbs > 0
                ? `Tow vehicle ≥ ${unit.minTowCapacityLbs.toLocaleString()} lb`
                : 'Motorhome — no tow vehicle'}
            </p>
            <ul className="flex flex-wrap gap-1 mb-3">
              {unit.highlights.slice(0, 3).map((h) => (
                <li key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                  {h}
                </li>
              ))}
            </ul>
            {!compact ? (
              <Link
                to="/rv/demo"
                className="text-xs font-semibold text-bee-amber hover:underline mt-auto"
              >
                Ask AI if this fits me
              </Link>
            ) : null}
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm py-8 text-center">No units match those filters — try the AI matcher.</p>
      ) : null}

      {!compact ? (
        <p className="text-[11px] text-slate-600 mt-6">{RV_DEMO_DISCLAIMER}</p>
      ) : null}
    </div>
  );
}
