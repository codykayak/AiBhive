import { RV_FAQ } from '../../content/rvSiteContent';

export function RvFaq() {
  return (
    <div className="space-y-3">
      {RV_FAQ.map((item) => (
        <details
          key={item.q}
          className="group rounded-xl border border-white/10 bg-black/25 open:bg-black/40 transition-colors"
        >
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-white flex justify-between gap-3">
            {item.q}
            <span className="text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
          </summary>
          <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
