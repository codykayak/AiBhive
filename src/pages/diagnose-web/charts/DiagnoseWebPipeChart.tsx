import { COPPER_PIPE_SIZES, DRAIN_SIZING, PLUMBING_CODE_REFS } from '@diagnose/lib/knowledge/plumbing/reference';

export default function DiagnoseWebPipeChart() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Pipe & venting</h1>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Copper / PEX nominal sizes</h2>
        <div className="space-y-2 text-sm">
          {COPPER_PIPE_SIZES.map((row) => (
            <div key={row.nominal} className="flex flex-wrap justify-between gap-2 px-3 py-2 rounded-lg bg-white/5">
              <span className="text-white font-semibold">{row.nominal}</span>
              <span className="text-slate-400">{row.fixtureUnits} FU · ID ~{row.idApproxIn}"</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Drain sizing</h2>
        <div className="space-y-2 text-sm">
          {DRAIN_SIZING.map((row) => (
            <div key={row.size} className="px-3 py-2 rounded-lg bg-white/5 text-slate-300">
              <span className="text-white font-semibold">{row.size}</span> — {row.use}. Slope: {row.slope}. {row.notes}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Venting quick refs</h2>
        <div className="space-y-3">
          {PLUMBING_CODE_REFS.map((ref) => (
            <div key={ref.id} className="rounded-xl border border-white/10 p-4 text-sm">
              <p className="font-bold text-white">{ref.title}</p>
              <p className="text-slate-400 mt-1">{ref.summary}</p>
              <ul className="mt-2 list-disc pl-5 text-slate-500">
                {ref.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
