import type { User } from 'firebase/auth';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  answerLivingKnowledgeQuery,
  buildLivingKnowledgeContextBlocks,
  rememberContributeSeed,
  suggestLivingKnowledgeTerms,
  type LivingKnowledgeAnswer,
  type LivingKnowledgeHit,
  type LivingKnowledgeScope,
} from '../../../lib/oregonPlantMedicine/livingKnowledgeRag';
import { sendLivingKnowledgeChat } from '../../../lib/oregonPlantMedicine/plantMedicineApi';

type Accent = 'emerald' | 'violet' | 'cyan' | 'rose' | 'lime';

const ACCENT: Record<
  Accent,
  { border: string; focus: string; badge: string; button: string; chip: string; soft: string }
> = {
  emerald: {
    border: 'border-emerald-500/35',
    focus: 'focus:border-emerald-500/55',
    badge: 'text-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20',
    soft: 'bg-emerald-500/10 border-emerald-500/25',
  },
  violet: {
    border: 'border-violet-500/35',
    focus: 'focus:border-violet-500/55',
    badge: 'text-violet-300',
    button: 'bg-violet-600 hover:bg-violet-500',
    chip: 'border-violet-500/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20',
    soft: 'bg-violet-500/10 border-violet-500/25',
  },
  cyan: {
    border: 'border-cyan-500/35',
    focus: 'focus:border-cyan-500/55',
    badge: 'text-cyan-300',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    chip: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20',
    soft: 'bg-cyan-500/10 border-cyan-500/25',
  },
  rose: {
    border: 'border-rose-500/35',
    focus: 'focus:border-rose-500/55',
    badge: 'text-rose-300',
    button: 'bg-rose-600 hover:bg-rose-500',
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20',
    soft: 'bg-rose-500/10 border-rose-500/25',
  },
  lime: {
    border: 'border-lime-500/35',
    focus: 'focus:border-lime-500/55',
    badge: 'text-lime-300',
    button: 'bg-lime-600 hover:bg-lime-500',
    chip: 'border-lime-500/30 bg-lime-500/10 text-lime-100 hover:bg-lime-500/20',
    soft: 'bg-lime-500/10 border-lime-500/25',
  },
};

type Props = {
  scope: LivingKnowledgeScope;
  accent?: Accent;
  /** Keep parent grid filters in sync while typing */
  onQueryChange?: (query: string) => void;
  onOpenPlant?: (plantId: string) => void;
  onOpenTopic?: (topicId: string, library: 'holistic' | 'hypnosis' | 'animal-health') => void;
  onContribute: (query?: string) => void;
  user?: User | null;
  onSignIn?: () => void;
  placeholder?: string;
};

function kindLabel(hit: LivingKnowledgeHit): string {
  if (hit.kind === 'plant') return 'Plant';
  if (hit.kind === 'essay') return 'Featured essay';
  return 'Topic';
}

export default function HolisticAskAgent({
  scope,
  accent = 'violet',
  onQueryChange,
  onOpenPlant,
  onOpenTopic,
  onContribute,
  user = null,
  onSignIn,
  placeholder = 'Ask the holistic AI agent — plants, protocols, energy, edibles…',
}: Props) {
  const theme = ACCENT[accent];
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<LivingKnowledgeAnswer | null>(null);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [error, setError] = useState('');

  const suggestions = useMemo(
    () => suggestLivingKnowledgeTerms(query, scope, 8),
    [query, scope],
  );

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenSuggest(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const openHit = useCallback(
    (hit: LivingKnowledgeHit) => {
      if (hit.plantId && onOpenPlant) onOpenPlant(hit.plantId);
      if (hit.topicId && hit.topicLibrary && onOpenTopic) onOpenTopic(hit.topicId, hit.topicLibrary);
    },
    [onOpenPlant, onOpenTopic],
  );

  const runAsk = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setError('');
      setEnhanced(null);
      setOpenSuggest(false);

      const local = answerLivingKnowledgeQuery(trimmed, scope);
      setAnswer(local);

      // Optional online enhancement when we have library context + signed-in user
      if (local.documented && local.hits.length > 0 && user && navigator.onLine) {
        try {
          const context = buildLivingKnowledgeContextBlocks(local.hits);
          const result = await sendLivingKnowledgeChat(user, {
            message: trimmed,
            context,
            scope,
          });
          if (result.reply?.trim()) setEnhanced(result.reply.trim());
        } catch {
          /* local answer already shown — enhancement is best-effort */
        }
      }

      setBusy(false);
    },
    [busy, scope, user],
  );

  const handleContribute = () => {
    const q = (answer?.query || query).trim();
    rememberContributeSeed(q, scope);
    onContribute(q || undefined);
  };

  return (
    <div ref={rootRef} className="w-full space-y-3">
      <div className={`rounded-xl border ${theme.soft} px-3 py-2.5`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${theme.badge} flex items-center gap-1.5`}>
          <Sparkles className="w-3.5 h-3.5" />
          Ask specially trained holistic AI agent
        </p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Instant offline library search · works without payment · grows when you contribute
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="search"
          role="combobox"
          aria-expanded={openSuggest}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenSuggest(true);
          }}
          onFocus={() => setOpenSuggest(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runAsk(query);
            }
            if (e.key === 'Escape') setOpenSuggest(false);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-28 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none ${theme.focus}`}
        />
        <button
          type="button"
          onClick={() => void runAsk(query)}
          disabled={busy || !query.trim()}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${theme.button}`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Ask
        </button>

        {openSuggest && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
          >
            {suggestions.map((hit) => (
              <li key={hit.id} role="option">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] border-b border-slate-800/80 last:border-0"
                  onClick={() => {
                    setQuery(hit.title);
                    setOpenSuggest(false);
                    const local = answerLivingKnowledgeQuery(hit.title, scope);
                    setAnswer(local);
                    setEnhanced(null);
                    openHit(hit);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{hit.title}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${theme.badge}`}>
                      {kindLabel(hit)}
                    </span>
                  </div>
                  {hit.subtitle ? <p className="text-[11px] text-slate-500 truncate mt-0.5">{hit.subtitle}</p> : null}
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{hit.summary}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {answer ? (
        <div className={`rounded-xl border ${theme.border} bg-slate-900/70 p-4 space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.badge}`}>
                {answer.documented ? `Library answer · ${answer.confidence} confidence` : 'Not in library yet'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Q: {answer.query}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAnswer(null);
                setEnhanced(null);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"
              aria-label="Dismiss answer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {(enhanced || answer.answer).split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
              const m = part.match(/^\*\*([^*]+)\*\*$/);
              if (m) {
                return (
                  <strong key={i} className="text-white font-bold">
                    {m[1]}
                  </strong>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>

          {enhanced ? (
            <p className="text-[11px] text-slate-500">
              Enhanced with online holistic AI using your Living Knowledge RAG context. Base retrieval still works
              offline.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Answered from the on-device Living Knowledge index — no credits required
              {user ? '' : onSignIn ? ' · sign in for optional online enhancement' : ''}.
            </p>
          )}

          {answer.hits.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {answer.hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => openHit(hit)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${theme.chip}`}
                >
                  <BookOpen className="w-3 h-3" />
                  {hit.title}
                </button>
              ))}
            </div>
          ) : null}

          {(answer.contributeSuggested || !answer.documented) && (
            <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs text-amber-100/90 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {answer.livingKnowledgeNote} Your search becomes a seed for the community archive.
              </p>
              <button
                type="button"
                onClick={handleContribute}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 font-bold text-xs px-3 py-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Contribute to the community
              </button>
            </div>
          )}

          {!answer.contributeSuggested && answer.documented ? (
            <button
              type="button"
              onClick={handleContribute}
              className="text-[11px] font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" />
              Expand this topic — contribute research
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
