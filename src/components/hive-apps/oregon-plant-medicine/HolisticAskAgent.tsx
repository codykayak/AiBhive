import type { User } from 'firebase/auth';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  ImagePlus,
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
  PlantCreditsError,
  fetchPlantMedicineBillingStatus,
  fileToPlantPhotoAttachment,
  sendLivingKnowledgeChat,
  sendPlantPhotoIdentify,
  type PlantChatMessage,
  type PlantPhotoAttachment,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import {
  HIVE_RESEARCH_LABEL,
  HIVE_RESEARCH_POWERED_BY,
} from '../../../lib/oregonPlantMedicine/branding';
import { LIVING_KNOWLEDGE_OPEN_ASK_EVENT } from '../../../lib/oregonPlantMedicine/livingKnowledgeAsk';
import {
  enrichPlantPhotoIdResult,
  type PlantIdVisual,
} from '../../../lib/oregonPlantMedicine/plantPhotoIdVisuals';

type Accent = 'emerald' | 'violet' | 'cyan' | 'rose' | 'lime' | 'amber' | 'teal';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hits?: LivingKnowledgeHit[];
  contributeSuggested?: boolean;
  source?: 'grok' | 'offline' | 'grok-vision';
  attachmentPreview?: string;
  candidates?: PlantIdVisual[];
  dangerousLookalikes?: PlantIdVisual[];
  chargedUsd?: number;
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
  amber: {
    border: 'border-amber-500/35',
    focus: 'focus:border-amber-500/55',
    badge: 'text-amber-300',
    button: 'bg-amber-600 hover:bg-amber-500',
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20',
    soft: 'bg-amber-500/10 border-amber-500/25',
    bubble: 'bg-amber-600/25 border-amber-500/25 text-amber-50',
  },
  teal: {
    border: 'border-teal-500/35',
    focus: 'focus:border-teal-500/55',
    badge: 'text-teal-300',
    button: 'bg-teal-600 hover:bg-teal-500',
    chip: 'border-teal-500/30 bg-teal-500/10 text-teal-100 hover:bg-teal-500/20',
    soft: 'bg-teal-500/10 border-teal-500/25',
    bubble: 'bg-teal-600/25 border-teal-500/25 text-teal-50',
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

function confidenceTone(label: string) {
  if (label === 'high') return 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100';
  if (label === 'medium') return 'border-amber-400/50 bg-amber-500/20 text-amber-100';
  return 'border-slate-500/50 bg-slate-700/40 text-slate-200';
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

function PlantVisualCard({
  item,
  dangerous,
  onOpen,
}: {
  item: PlantIdVisual;
  dangerous?: boolean;
  onOpen?: (plantId: string) => void;
}) {
  const imgs = [item.imageUrl, ...item.additionalImages.map((a) => a.url)].filter(Boolean) as string[];
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        dangerous ? 'border-rose-500/45 bg-rose-950/40' : 'border-slate-700 bg-slate-950/70'
      }`}
    >
      {imgs[0] ? (
        <div className="grid grid-cols-2 gap-0.5 bg-black/40">
          {imgs.slice(0, 2).map((src) => (
            <img key={src} src={src} alt={item.commonName} className="h-24 w-full object-cover" loading="lazy" />
          ))}
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center text-[10px] text-slate-500 bg-slate-900">
          No library photo yet
        </div>
      )}
      <div className="p-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-white leading-tight">{item.commonName}</p>
            {item.scientificName ? (
              <p className="text-[10px] italic text-slate-400">{item.scientificName}</p>
            ) : null}
          </div>
          {!dangerous ? (
            <span
              className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${confidenceTone(
                item.confidenceLabel,
              )}`}
            >
              {item.confidenceLabel} {Math.round((item.confidence || 0) * 100)}%
            </span>
          ) : (
            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-rose-400/50 bg-rose-500/20 text-rose-100">
              Look-alike
            </span>
          )}
        </div>
        {(item.rationale || item.whyDangerous) && (
          <p className="text-[10px] text-slate-300 leading-snug line-clamp-3">
            {item.whyDangerous || item.rationale}
          </p>
        )}
        {item.plantId && onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(item.plantId!)}
            className="text-[10px] font-bold text-emerald-300 hover:underline"
          >
            Open in library →
          </button>
        ) : null}
      </div>
    </div>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [openSuggest, setOpenSuggest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [attachment, setAttachment] = useState<PlantPhotoAttachment | null>(null);
  const [creditsNeeded, setCreditsNeeded] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [identifyingPhoto, setIdentifyingPhoto] = useState(false);
  const [adminExempt, setAdminExempt] = useState(false);

  const suggestions = useMemo(() => suggestLivingKnowledgeTerms(query, scope, 8), [query, scope]);
  const photoIdEnabled = scope === 'all' || scope === 'plants' || scope === 'edibles';
  const photoIdFreeForUser = adminExempt;

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ focus?: boolean }>).detail;
      if (!detail?.focus) return;
      window.setTimeout(() => inputRef.current?.focus(), 120);
    };
    window.addEventListener(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, onOpen);
    return () => window.removeEventListener(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!user) {
      setAdminExempt(false);
      return;
    }
    let cancelled = false;
    void fetchPlantMedicineBillingStatus(user)
      .then((status) => {
        if (!cancelled) setAdminExempt(!!status?.adminExempt);
      })
      .catch(() => {
        if (!cancelled) setAdminExempt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    try {
      const att = await fileToPlantPhotoAttachment(file, { forVision: true });
      setAttachment(att);
      setError('');
      setCreditsNeeded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read photo');
    }
  };

  const addCredits = async () => {
    setCheckoutBusy(true);
    try {
      const url = await startLivingKnowledgeCreditsCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      const pendingPhoto = attachment;
      if ((!trimmed && !pendingPhoto) || busy) return;

      if (pendingPhoto && !user) {
        onSignIn?.();
        setError('Sign in to use paid photo plant ID (Bhive Credits).');
        return;
      }

      const userMsg: ChatMsg = {
        id: uid(),
        role: 'user',
        content: trimmed || (pendingPhoto ? 'Identify this plant from my photo.' : ''),
        attachmentPreview: pendingPhoto?.previewUrl,
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setQuery('');
      setOpenSuggest(false);
      setBusy(true);
      setError('');
      setCreditsNeeded(false);
      setAttachment(null);

      const priorUser = next.filter((m) => m.role === 'user').map((m) => m.content);
      const blendedQuery = priorUser.slice(-4).join(' ');
      const retrieval = suggestLivingKnowledgeTerms(trimmed || blendedQuery, scope, 5);
      const blendedHits =
        retrieval.length > 0 ? retrieval : suggestLivingKnowledgeTerms(blendedQuery, scope, 5);
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;

      // Paid photo plant ID (Diagnose-style vision)
      if (pendingPhoto && user) {
        setIdentifyingPhoto(true);
        try {
          const context = buildLivingKnowledgeContextBlocks(blendedHits);
          const result = await sendPlantPhotoIdentify(user, {
            message:
              trimmed ||
              'Identify this plant or mushroom from the photo. Rank confidence and list dangerous look-alikes.',
            context,
            attachment: pendingPhoto,
          });
          const visuals = enrichPlantPhotoIdResult({
            candidates: result.candidates,
            dangerousLookalikes: result.dangerousLookalikes,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'assistant',
              content: result.reply,
              hits: blendedHits,
              candidates: visuals.candidates,
              dangerousLookalikes: visuals.dangerousLookalikes,
              contributeSuggested: visuals.candidates.length === 0,
              source: 'grok-vision',
              chargedUsd: result.chargedUsd,
            },
          ]);
          setBusy(false);
          setIdentifyingPhoto(false);
          return;
        } catch (err) {
          setIdentifyingPhoto(false);
          if (err instanceof PlantCreditsError) {
            setCreditsNeeded(true);
            setError(err.message);
            setBusy(false);
            return;
          }
          setError(err instanceof Error ? err.message : 'Photo ID failed — try again or ask in text.');
          // fall through to text if they also typed
          if (!trimmed) {
            setBusy(false);
            return;
          }
        }
      }

      // Bhive Credits text path (Diagnose-style): multi-turn history + optional clarifiers
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
          setError(err instanceof Error ? err.message : `${HIVE_RESEARCH_LABEL} unavailable — using offline library.`);
        }
      }

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
    [attachment, busy, messages, onSignIn, scope, user],
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div ref={rootRef} id="lk-ask-agent" data-lk-ask-agent="" className="w-full space-y-3">
      <div className={`rounded-xl border ${theme.soft} px-3 py-2.5`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${theme.badge} flex items-center gap-1.5`}>
          <Sparkles className="w-3.5 h-3.5" />
          Ask specially trained holistic AI agent
        </p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          {HIVE_RESEARCH_LABEL} · {HIVE_RESEARCH_POWERED_BY} · may ask a clarifying follow-up · library browse works
          offline without payment
          {photoIdEnabled
            ? photoIdFreeForUser
              ? ' · admin account — photo plant ID is free'
              : ' · photo plant ID is a paid Hive-credits feature'
            : ''}
        </p>
      </div>

      {messages.length > 0 ? (
        <div className={`rounded-xl border ${theme.border} bg-slate-950/80 max-h-[28rem] overflow-y-auto p-3 space-y-2.5`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap border ${
                msg.role === 'user' ? `ml-6 ${theme.bubble}` : 'mr-4 bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {msg.role === 'assistant' ? (
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${theme.badge}`}>
                  {msg.source === 'grok-vision'
                    ? `${HIVE_RESEARCH_LABEL} · Photo ID`
                    : msg.source === 'grok'
                      ? `${HIVE_RESEARCH_LABEL} · Living Knowledge`
                      : 'Offline library'}
                  {typeof msg.chargedUsd === 'number' && msg.chargedUsd > 0
                    ? ` · $${msg.chargedUsd.toFixed(3)} credits`
                    : ''}
                </p>
              ) : null}
              {msg.attachmentPreview ? (
                <img
                  src={msg.attachmentPreview}
                  alt="Attached plant"
                  className="mb-2 max-h-40 rounded-lg border border-white/10 object-cover"
                />
              ) : null}
              <div>{renderMarkdownLite(msg.content)}</div>

              {msg.candidates && msg.candidates.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Identification matches
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.candidates.map((c, i) => (
                      <PlantVisualCard key={`${c.plantId || c.commonName}_${i}`} item={c} onOpen={onOpenPlant} />
                    ))}
                  </div>
                </div>
              ) : null}

              {msg.dangerousLookalikes && msg.dangerousLookalikes.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Dangerous look-alikes
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.dangerousLookalikes.map((c, i) => (
                      <PlantVisualCard
                        key={`danger_${c.plantId || c.commonName}_${i}`}
                        item={c}
                        dangerous
                        onOpen={onOpenPlant}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

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
              {identifyingPhoto
                ? `${HIVE_RESEARCH_LABEL} is identifying your photo…`
                : `${HIVE_RESEARCH_LABEL} is running…`}
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

      {creditsNeeded && !adminExempt ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs text-amber-100/90">
            Photo plant ID uses {HIVE_RESEARCH_LABEL} ({HIVE_RESEARCH_POWERED_BY}). Add Bhive Credits to continue.
          </p>
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void addCredits()}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40 text-amber-50 font-bold text-xs px-3 py-2 disabled:opacity-50"
          >
            {checkoutBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Add Bhive Credits
          </button>
        </div>
      ) : null}

      {attachment ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-2">
          <img src={attachment.previewUrl} alt="Pending plant photo" className="h-14 w-14 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Photo ready for ID</p>
            <p className="text-[10px] text-amber-200/90">
              {photoIdFreeForUser
                ? `Admin account — ${HIVE_RESEARCH_LABEL} photo ID at no charge`
                : `Paid ${HIVE_RESEARCH_LABEL} photo ID · returns confidence + dangerous look-alikes`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input ref={inputRef}
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
            attachment
              ? 'Optional note about the plant (habitat, region)…'
              : messages.length > 0 && lastAssistant && looksLikeLivingKnowledgeClarifier(lastAssistant.content)
                ? 'Reply to Hive Research follow-up…'
                : placeholder
          }
          className={`w-full pl-10 pr-36 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none ${theme.focus}`}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {photoIdEnabled ? (
            <>
              <button
                type="button"
                title={photoIdFreeForUser ? 'Take photo for ID' : 'Take photo (paid ID)'}
                onClick={() => {
                  if (!user && onSignIn) onSignIn();
                  cameraRef.current?.click();
                }}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={photoIdFreeForUser ? 'Upload plant photo for ID' : 'Upload plant photo (paid ID)'}
                onClick={() => {
                  if (!user && onSignIn) onSignIn();
                  fileRef.current?.click();
                }}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => void send(query)}
            disabled={busy || (!query.trim() && !attachment)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${theme.button}`}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
        />

        {openSuggest && suggestions.length > 0 && messages.length === 0 && !attachment ? (
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
          Sign in so {HIVE_RESEARCH_LABEL} can ask clarifying follow-ups
          {photoIdEnabled
            ? photoIdFreeForUser
              ? ' and run photo ID for free'
              : ' and run paid photo ID'
            : ''}{' '}
          (text is free)
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
