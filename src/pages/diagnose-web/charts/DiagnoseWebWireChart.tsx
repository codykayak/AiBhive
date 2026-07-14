import { COPPER_AMPACITY, COMMON_TORQUE } from '@/lib/knowledge/electrical/reference';

export default function DiagnoseWebWireChart() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Wire & torque</h1>
      <h2 className="text-sm font-bold uppercase text-slate-500 mt-8 mb-3">Copper ampacity (°C rated, typical)</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="p-3">AWG</th>
              <th className="p-3">60°C</th>
              <th className="p-3">75°C</th>
              <th className="p-3">90°C</th>
            </tr>
          </thead>
          <tbody>
            {COPPER_AMPACITY.map((row) => (
              <tr key={row.awg} className="border-t border-white/5">
                <td className="p-3 font-mono text-amber-400">{row.awg}</td>
                <td className="p-3 text-slate-300">{row.copper60}</td>
                <td className="p-3 text-slate-300">{row.copper75}</td>
                <td className="p-3 text-slate-300">{row.copper90}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-sm font-bold uppercase text-slate-500 mt-8 mb-3">Lug torque reminders</h2>
      <ul className="space-y-2 text-sm text-slate-300">
        {COMMON_TORQUE.map((t) => (
          <li key={t.item} className="px-3 py-2 rounded-lg bg-white/5">
            <span className="text-white font-semibold">{t.item}</span> — {t.torque}. {t.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
