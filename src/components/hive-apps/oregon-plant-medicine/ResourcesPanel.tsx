import { ExternalLink } from 'lucide-react';
import { EXTERNAL_RESOURCE_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';

export default function ResourcesPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 leading-relaxed">
        Curated external guides with photos and identification help. Links open in a new tab — for private study only.
      </p>
      {EXTERNAL_RESOURCE_LIBRARY.map((cat) => (
        <section key={cat.id} className="rounded-xl border border-emerald-500/20 bg-slate-900/40 overflow-hidden">
          <div className="p-4 border-b border-emerald-500/10">
            <h2 className="font-bold text-emerald-300">{cat.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
          </div>
          <ul className="divide-y divide-slate-800">
            {cat.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 hover:bg-white/[0.03] transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{link.label}</p>
                    {link.description ? (
                      <p className="text-xs text-slate-400 mt-0.5">{link.description}</p>
                    ) : null}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
