import { Link, useParams } from 'react-router-dom';
import { getWebTradePack } from '../../context/DiagnoseWebContext';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import type { TradePackId } from '../../../aibhive-diagnose/lib/packs/types';

export default function DiagnoseWebPackDetail() {
  const { packId } = useParams<{ packId: TradePackId }>();
  const { setActivePackId } = useDiagnoseWeb();
  const pack = packId ? getWebTradePack(packId) : null;

  if (!pack) {
    return <p className="p-8 text-slate-400">Pack not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: pack.accentColor }}>
        {pack.tagline}
      </p>
      <h1 className="text-3xl font-black text-white mt-2">{pack.name}</h1>
      <p className="text-slate-400 mt-4">{pack.description}</p>

      <button
        type="button"
        onClick={() => setActivePackId(pack.id)}
        className="mt-6 px-5 py-2.5 rounded-xl font-bold text-black"
        style={{ backgroundColor: pack.accentColor }}
      >
        Set as active pack
      </button>

      <h2 className="text-sm font-bold uppercase text-slate-500 mt-10 mb-4">Categories</h2>
      <div className="space-y-3">
        {pack.categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-white/10 bg-[#0c1018] p-4">
            <p className="font-bold text-white">{cat.label}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {cat.examples.map((ex) => (
                <Link
                  key={ex}
                  to={`/diagnose/app/chat?prompt=${encodeURIComponent(ex)}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white"
                >
                  {ex}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-bold uppercase text-slate-500 mt-10 mb-4">Common equipment</h2>
      <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-400">
        {pack.commonEquipment.map((eq) => (
          <li key={eq} className="px-3 py-2 rounded-lg bg-white/5">{eq}</li>
        ))}
      </ul>
    </div>
  );
}
