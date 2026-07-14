import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useDiagnoseWeb, WEB_TRADE_PACK_LIST } from '../../context/DiagnoseWebContext';

export default function DiagnoseWebPacks() {
  const { activePack, setActivePackId } = useDiagnoseWeb();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Trade packs</h1>
      <p className="text-slate-400 mt-2 text-sm">Each pack includes fault playbooks, RAG corpus, guided flows, and reference tools.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {WEB_TRADE_PACK_LIST.map((pack) => {
          const active = pack.id === activePack.id;
          return (
            <div
              key={pack.id}
              className="rounded-2xl border p-5 flex flex-col"
              style={{
                borderColor: active ? pack.accentColor : 'rgba(255,255,255,0.1)',
                backgroundColor: active ? `${pack.accentColor}11` : '#0c1018',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white text-lg">{pack.name}</p>
                  <p className="text-xs mt-1" style={{ color: pack.accentColor }}>
                    {pack.tagline}
                  </p>
                </div>
                {active && <Check className="w-5 h-5 shrink-0" style={{ color: pack.accentColor }} />}
              </div>
              <p className="text-sm text-slate-400 mt-3 flex-1">{pack.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pack.categories.slice(0, 3).map((c) => (
                  <span key={c.id} className="text-xs px-2 py-1 rounded-lg bg-black/30 text-slate-400">
                    {c.label}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePackId(pack.id)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-black"
                  style={{ backgroundColor: pack.accentColor }}
                >
                  {active ? 'Active' : 'Activate'}
                </button>
                <Link
                  to={`/diagnose/app/packs/${pack.id}`}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-white/15 text-white hover:bg-white/5"
                >
                  Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
