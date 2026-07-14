import {
  DELTA_T_TARGETS,
  FILTER_GUIDE,
  SUBCOOL_TARGETS,
  SUPERHEAT_TARGETS,
} from '@diagnose/lib/knowledge/hvac/reference';

export default function DiagnoseWebHvacChart() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">HVAC charge targets</h1>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Superheat targets</h2>
        <div className="space-y-2">
          {SUPERHEAT_TARGETS.map((row) => (
            <div key={row.refrigerant} className="rounded-xl border border-white/10 p-4 text-sm">
              <p className="font-bold text-white">{row.refrigerant}</p>
              <p className="text-slate-400 mt-1">Target: {row.targetSuperheatF}</p>
              <p className="text-slate-500 text-xs">{row.conditions} — {row.notes}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Subcool targets</h2>
        <div className="space-y-2">
          {SUBCOOL_TARGETS.map((row) => (
            <div key={`${row.refrigerant}-${row.targetSubcoolF}`} className="rounded-xl border border-white/10 p-4 text-sm">
              <p className="font-bold text-white">{row.refrigerant}</p>
              <p className="text-slate-400">{row.targetSubcoolF}</p>
              <p className="text-slate-500 text-xs">{row.notes}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Delta-T at supply</h2>
        <div className="space-y-2">
          {DELTA_T_TARGETS.map((row) => (
            <div key={row.mode} className="px-3 py-2 rounded-lg bg-white/5 text-sm text-slate-300">
              <span className="text-white font-semibold">{row.mode}</span> — {row.healthySplitF}. {row.notes}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Filter guide</h2>
        <div className="space-y-2">
          {FILTER_GUIDE.map((row) => (
            <div key={row.size} className="px-3 py-2 rounded-lg bg-white/5 text-sm text-slate-300">
              {row.size} — MERV {row.merv}. {row.notes}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
