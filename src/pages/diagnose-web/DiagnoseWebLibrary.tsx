import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchFaults } from '@/lib/knowledge/search';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';

export default function DiagnoseWebLibrary() {
  const { activePack } = useDiagnoseWeb();
  const [query, setQuery] = useState('');

  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return searchFaults('', activePack.id).slice(0, 20);
    return searchFaults(q, activePack.id).slice(0, 24);
  }, [query, activePack.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Fault library</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search symptoms, equipment, fault titles…"
        className="mt-6 w-full px-4 py-3 rounded-xl bg-[#0c1018] border border-white/10 text-white"
      />
      <div className="mt-6 space-y-2">
        {hits.map((f) => (
          <Link
            key={f.id}
            to={`/diagnose/app/fault/${f.id}`}
            className="block rounded-xl border border-white/10 bg-[#0c1018] px-4 py-3 hover:border-white/20"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">{f.title}</p>
              <span className="text-[10px] uppercase font-bold text-slate-500">{f.severity}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{f.category} · {f.packId}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
