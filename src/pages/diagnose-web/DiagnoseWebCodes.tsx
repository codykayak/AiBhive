import { useMemo, useState } from 'react';
import { searchCodes } from '@/lib/knowledge/search';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';

export default function DiagnoseWebCodes() {
  const { activePack } = useDiagnoseWeb();
  const [query, setQuery] = useState('');

  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return searchCodes('', activePack.id).slice(0, 30);
    return searchCodes(q, activePack.id).slice(0, 24);
  }, [query, activePack.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Error codes</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Code, brand, or symptom…"
        className="mt-6 w-full px-4 py-3 rounded-xl bg-[#0c1018] border border-white/10 text-white"
      />
      <div className="mt-6 space-y-3">
        {hits.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-[#0c1018] p-4">
            <p className="font-mono font-bold text-amber-400">{c.code}</p>
            <p className="text-sm text-white mt-1">{c.meaning}</p>
            <ul className="mt-2 text-sm text-slate-400 list-disc pl-5">
              {c.fix.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
