import type { User } from 'firebase/auth';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  PlusCircle,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  buildLivingKnowledgeContextBlocks,
  looksLikeLivingKnowledgeClarifier,
  offlineLivingKnowledgeReply,
  rememberContributeSeed,
  suggestLivingKnowledgeTerms,
  type LivingKnowledgeHit,
  type LivingKnowledgeScope,
} from '../../../lib/oregonPlantMedicine/livingKnowledgeRag';
import {
  sendLivingKnowledgeChat,
  type PlantChatMessage,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';

type Accent = 'emerald' | 'violet' | 'cyan' | 'rose' | 'lime';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hits?: LivingKnowledgeHit[];
  contributeSuggested?: boolean;
  source?: 'grok' | 'offline';
};

const ACCENT: Record<
  Accent,
  { border: string; focus: string; badge: string; button: string; chip: string; soft: string; bubble: string }
> = {
  emerald: {
    border: 'border-emerald-500/35',
    focus: 'focus:border-emerald-500/55',
    badge: 'text-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20',
    soft: 'bg-emerald-500/10 border-emerald-500/25',
    bubble: 'bg-emerald-600/25 border-emerald-500/25 text-emerald-50',
  },
  violet: {
    border: 'border-violet-500/35',
    focus: 'focus:border-violet-500/55',
    badge: 'text-violet-300',
    button: 'bg-violet-600 hover:bg-violet-500',
    chip: 'border-violet-500/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20',
    soft: 'bg-violet-500/10 border-violet-500/25',
    bubble: 'bg-violet-600/25 border-violet-500/25 text-violet-50',
  },
  cyan: {
    border: 'border-cyan-500/35',
    focus: 'focus:border-cyan-500/55',
    badge: 'text-cyan-300',
    button: 'bg-cyan-600 hover:bg-cyan-500',
    chip: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20',
    soft: 'bg-cyan-500/10 border-cyan-500/25',
    bubble: 'bg-cyan-600/25 border-cyan-500/25 text-cyan-50',
  },
  rose: {
    border: 'border-rose-500/35',
    focus: 'focus:border-rose-500/55',
    badge: 'text-rose-300',
    button: 'bg-rose-600 hover:bg-rose-500',
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20',
    soft: 'bg-rose-500/10 border-rose-500/25',
    bubble: 'bg-rose-600/25 border-rose-500/25 text-rose-50',
  },
  lime: {
    border: 'border-lime-500/35',
    focus: 'focus:border-lime-500/55',
    badge: 'text-lime-300',
    button: 'bg-lime-600 hover:bg-lime-500',
    chip: 'border-lime-500/30 bg-lime-500/10 text-lime-100 hover:bg-lime-500/20',
    soft: 'bg-lime-500/10 border-lime-500/25',
    bubble: 'bg-lime-600/25 border-lime-500/25 text-lime-50',
  },
};

type Props = {
  scope: LivingKnowledgeScope;
  accent?: Accent;
  onQueryChange?: (query: string) => void;
  onOpenPlant?: (plantId: string) => void;
  onOpenTopic?: (topicId: string, library: 'holistic' | 'hypnosis' | 'animal-health') => void;
  onContribute: (query?: string) => void;
  user?: User | null;
  onSignIn?: () => void;
  placeholder?: string;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function kindLabel(hit: LivingKnowledgeHit): string {
  if (hit.kind === 'plant') return 'Plant';
  if (hit.kind === 'essay') return 'Featured essay';
  return 'Topic';
}

function renderMarkdownLite(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <strong key={i} className="text-white font-bold">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const suggestions = useMemo(() => suggestLivingKnowledgeTerms(query, scope, 8), [query, scope]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

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

  const handleContribute = (seed?: string) => {
    const q = (seed || query || messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '').trim();
    rememberContributeSeed(q, scope);
    onContribute(q || undefined);
  };

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || busy) return;

      const userMsg: ChatMsg = { id: uid(), role: 'user', content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setQuery('');
      setOpenSuggest(false);
      setBusy(true);
      setError('');

      const priorUser = next.filter((m) => m.role === 'user').map((m) => m.content);
      const blendedQuery = priorUser.slice(-4).join(' ');
      const retrieval = suggestLivingKnowledgeTerms(trimmed, scope, 5);
      const blendedHits =
        retrieval.length > 0 ? retrieval : suggestLivingKnowledgeTerms(blendedQuery, scope, 5);

      const online = typeof navigator === 'undefined' ? true : navigator.onLine;

      // Grok path (Diagnose-style): multi-turn history + optional clarifiers
      if (user && online) {
        try {
          const context = buildLivingKnowledgeContextBlocks(blendedHits);
          const history: PlantChatMessage[] = next.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          }));
          const result = await sendLivingKnowledgeChat(user, {
            message: trimmed,
            context,
            scope,
            history,
          });
          const isClarifier = looksLikeLivingKnowledgeClarifier(result.reply);
          const contributeSuggested =
            !isClarifier &&
            (/not (yet )?(in|covered|documented)|don.?t (yet )?have|contribute|missing from the library/i.test(
              result.reply,
            ) ||
              blendedHits.length === 0);
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'assistant',
              content: result.reply,
              hits: blendedHits,
              contributeSuggested,
              source: 'grok',
            },
          ]);
          setBusy(false);
          return;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Grok unavailable — using offline library.');
        }
      }

      // Offline / unsigned: local RAG + clarifying probes (Diagnose offlineConversation pattern)
      const offline = offlineLivingKnowledgeReply(trimmed, scope, {
        priorUserTexts: priorUser.slice(0, -1),
        signedIn: Boolean(user),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: offline.reply,
          hits: offline.hits,
          contributeSuggested: offline.contributeSuggested && !offline.isClarifier,
          source: 'offline',
        },
      ]);
      setBusy(false);
    },
    [busy, messages, scope, user],
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div ref={rootRef} className="w-full space-y-3">
      <div className={`rounded-xl border ${theme.soft} px-3 py-2.5`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${theme.badge} flex items-center gap-1.5`}>
          <Sparkles className="w-3.5 h-3.5" />
          Ask specially trained holistic AI agent
        </p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Powered by Grok · may ask a clarifying follow-up · library RAG works offline without payment
        </p>
      </div>

      {messages.length > 0 ? (
        <div className={`rounded-xl border ${theme.border} bg-slate-950/80 max-h-80 overflow-y-auto p-3 space-y-2.5`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap border ${
                msg.role === 'user' ? `ml-6 ${theme.bubble}` : 'mr-4 bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {msg.role === 'assistant' ? (
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${theme.badge}`}>
                  {msg.source === 'grok' ? 'Grok · Living Knowledge' : 'Offline library'}
                </p>
              ) : null}
              <div>{renderMarkdownLite(msg.content)}</div>
              {msg.hits && msg.hits.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.hits.slice(0, 4).map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => openHit(hit)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${theme.chip}`}
                    >
                      <BookOpen className="w-3 h-3" />
                      {hit.title}
                      <span className="opacity-60">{kindLabel(hit)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {busy ? (
            <div className={`flex items-center gap-2 text-xs ${theme.badge}`}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Grok is thinking…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      ) : null}

      {lastAssistant?.contributeSuggested ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs text-amber-100/90 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Not fully documented yet — contribute so this answer becomes part of Living Knowledge for everyone.
          </p>
          <button
            type="button"
            onClick={() => handleContribute()}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 font-bold text-xs px-3 py-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Contribute to the community
          </button>
        </div>
      ) : null}

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
              void send(query);
            }
            if (e.key === 'Escape') setOpenSuggest(false);
          }}
          placeholder={
            messages.length > 0 && lastAssistant && looksLikeLivingKnowledgeClarifier(lastAssistant.content)
              ? 'Reply to Grok’s follow-up…'
              : placeholder
          }
          className={`w-full pl-10 pr-28 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none ${theme.focus}`}
        />
        <button
          type="button"
          onClick={() => void send(query)}
          disabled={busy || !query.trim()}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${theme.button}`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Ask
        </button>

        {openSuggest && suggestions.length > 0 && messages.length === 0 ? (
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
                    void send(`Tell me about ${hit.title}`);
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

      {error ? <p className="text-xs text-amber-300">{error}</p> : null}

      {!user && onSignIn ? (
        <button
          type="button"
          onClick={onSignIn}
          className={`text-[11px] font-semibold ${theme.badge} hover:underline`}
        >
          Sign in so Grok can ask clarifying follow-ups (free)
        </button>
      ) : null}
      {messages.length > 0 ? (
        <button
          type="button"
          onClick={() => setMessages([])}
          className="text-[11px] text-slate-500 hover:text-white inline-flex items-center gap-1 ml-3"
        >
          <X className="w-3 h-3" /> Clear conversation
        </button>
      ) : null}
    </div>
  );
}
