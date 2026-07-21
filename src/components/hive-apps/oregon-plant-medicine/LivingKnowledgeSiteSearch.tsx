import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchSite, type SiteSearchResult } from '../../../lib/oregonPlantMedicine/siteSearch';

type Props = {
  onSelect: (result: SiteSearchResult) => void;
  className?: string;
};

export default function LivingKnowledgeSiteSearch({ onSelect, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchSite(query, 10), [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = () => {
    if (results[0]) {
      onSelect(results[0]);
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={wrapRef} className={`relative mx-auto w-full ${className}`}>
      <form
        className="flex flex-col sm:flex-row gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search plants, topics, essays, and community…"
            aria-label="Search Living Knowledge site"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 text-sm"
        >
          Search site
        </button>
      </form>

      {open && query.trim() && results.length > 0 ? (
        <ul className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-slate-900 border-b border-slate-800/80 last:border-0"
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <p className="text-sm font-bold text-white line-clamp-1">{r.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{r.subtitle}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
