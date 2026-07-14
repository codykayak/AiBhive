import { FIBER_CODE_REFS, FIBER_LOSS_BUDGET, FIBER_WAVELENGTHS } from '@diagnose/lib/knowledge/fiber/reference';

export default function DiagnoseWebFiberChart() {
  const laser = FIBER_CODE_REFS.find((r) => r.id === 'laser-safety');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Fiber loss & wavelengths</h1>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Loss budgets</h2>
        <div className="space-y-2">
          {FIBER_LOSS_BUDGET.map((row) => (
            <div key={row.element} className="rounded-xl border border-white/10 p-4 text-sm flex justify-between gap-4">
              <div>
                <p className="font-bold text-violet-300">{row.element}</p>
                {row.notes && <p className="text-slate-500 text-xs mt-1">{row.notes}</p>}
              </div>
              <p className="font-mono text-white shrink-0">{row.typicalLossDb} dB</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Wavelengths</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">nm</th>
                <th className="p-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {FIBER_WAVELENGTHS.map((w) => (
                <tr key={w.use} className="border-t border-white/5">
                  <td className="p-3 text-white">{w.use}</td>
                  <td className="p-3 font-mono text-violet-300">{w.nm}</td>
                  <td className="p-3 text-slate-400">{w.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {laser && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase text-slate-500 mb-3">Laser safety</h2>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
            <p className="font-bold text-white">{laser.title}</p>
            <p className="text-slate-400 mt-1">{laser.summary}</p>
            <ul className="mt-2 list-disc pl-5 text-slate-300">
              {laser.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
