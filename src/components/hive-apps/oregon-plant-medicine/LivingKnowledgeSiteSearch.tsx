import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchSite, type SiteSearchResult, type SiteSearchResultKind } from '../../../lib/oregonPlantMedicine/siteSearch';

type Props = {
  onSelect: (result: SiteSearchResult) => void;
  className?: string;
};

const POPULAR_SEARCHES = [
  'chanterelle',
  'dandelion',
  'turmeric',
  'reishi',
  'magnesium',
  'lion mane',
  'QHHT',
  'elderberry',
] as const;

const KIND_STYLES: Record<SiteSearchResultKind, string> = {
  plant: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  herbs: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  supplements: 'bg-teal-500/15 text-teal-200 border-teal-500/30',
  holistic: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
  hypnosis: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
  'animal-health': 'bg-rose-500/15 text-rose-200 border-rose-500/30',
  essay: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
  tab: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
};

function kindLabel(kind: SiteSearchResultKind): string {
  if (kind === 'animal-health') return 'Animal health';
  if (kind === 'essay') return 'Essay';
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export default function LivingKnowledgeSiteSearch({ onSelect, className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchSite(query, 12), [query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (result: SiteSearchResult) => {
    onSelect(result);
    setOpen(false);
    setQuery('');
  };

  const submit = () => {
    if (results[highlight]) pick(results[highlight]);
  };

  const runPopular = (term: string) => {
    setQuery(term);
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <form
        className="flex flex-col sm:flex-row gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open || !results.length) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Try chanterelle, turmeric, sleep herbs, QHHT…"
            aria-label="Search Living Knowledge"
            aria-expanded={open && !!query.trim()}
            aria-autocomplete="list"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || results.length === 0}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold px-5 py-3 text-sm shadow-sm"
        >
          Search
        </button>
      </form>

      {!query.trim() ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => runPopular(term)}
              className="rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      ) : null}

      {open && query.trim() ? (
        results.length > 0 ? (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 shadow-2xl overflow-hidden">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
              {results.length} match{results.length === 1 ? '' : 'es'} — use ↑↓ and Enter
            </p>
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 border-b border-slate-800/80 last:border-0 transition-colors ${
                      i === highlight ? 'bg-sky-500/15' : 'hover:bg-slate-900'
                    }`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(r)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white line-clamp-1">{r.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.subtitle}</p>
                      </div>
                      <span
                        className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${KIND_STYLES[r.kind]}`}
                      >
                        {kindLabel(r.kind)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 shadow-2xl px-4 py-5 text-center">
            <p className="text-sm font-semibold text-white">No matches for “{query.trim()}”</p>
            <p className="text-xs text-slate-400 mt-1">Try a common name, Latin name, or topic keyword.</p>
          </div>
        )
      ) : null}
    </div>
  );
}
