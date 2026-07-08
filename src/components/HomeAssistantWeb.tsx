import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  loadAssistantHistory,
  saveAssistantHistory,
  type WebAssistantMessage,
} from '../lib/homeAssistantHistory';
import {
  preloadHomeAssistantKnowledge,
  sendHomeAssistantTurn,
  runHomeAssistantWebSearch,
  type HomeAssistantAction,
  type ChatTurn,
} from '../lib/homeAssistantWeb';
import { installToolkitApp } from '../lib/hiveStoreApi';
import { getOrCreateWebHiveUserId } from '../lib/hiveWebUser';
import { useAssistantDock, TOP_BAR_HEIGHT } from '../context/AssistantDockContext';

const WELCOME =
  "Hi — I'm Bhive Builder. Ask me to research a target, build a tool, track jobs, or install something from the community hive.";

const QUICK = [
  { label: 'Research a company', text: 'Research Acme Corp — leadership, tech stack, and public contacts' },
  { label: 'Build a tool', text: 'Build me a habit tracker with daily streaks' },
  { label: 'Better job', text: 'Help me land a better job — tracker and resume' },
];

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function HomeAssistantWeb() {
  const navigate = useNavigate();
  const { dockMode, expanded, setExpanded, topBarHeight } = useAssistantDock();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WebAssistantMessage[]>(() => {
    const saved = loadAssistantHistory();
    return saved.length ? saved : [{ id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<HomeAssistantAction | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    void preloadHomeAssistantKnowledge();
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ prefill?: string }>).detail;
      if (detail?.prefill) setInput(detail.prefill);
      setOpen(true);
      setExpanded(true);
    };
    window.addEventListener('bhive:open-assistant', onOpen);
    return () => window.removeEventListener('bhive:open-assistant', onOpen);
  }, []);

  useEffect(() => {
    if (messages.length > 1) saveAssistantHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (!open && !expanded) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, open, expanded]);

  const appendAi = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'ai', content, at: new Date().toISOString() }]);
  }, []);

  const handleAction = useCallback(
    async (action: HomeAssistantAction) => {
      if (action.intent === 'research' && action.intelIntent?.trim()) {
        appendAi(action.reply);
        const q = encodeURIComponent(action.intelIntent.trim());
        navigate(`/app/research?intent=${q}`);
        return;
      }
      if (action.intent === 'research') {
        appendAi(action.reply);
        navigate('/app/research');
        return;
      }
      if (action.intent === 'jobs') {
        appendAi(action.reply);
        navigate('/hive-apps/run/example-job-hunter');
        return;
      }
      if (action.intent === 'build' && action.buildStage === 'confirm' && action.buildMessage?.trim()) {
        appendAi(action.reply);
        navigate(`/hive-apps/build?q=${encodeURIComponent(action.buildMessage.trim())}`);
        return;
      }
      if (action.intent === 'toolkit_offer') {
        appendAi(action.reply);
        setPendingAction(action);
        setOpen(true);
        setExpanded(true);
        return;
      }
      if (action.buildStage === 'propose' && (action.buildMessage || action.buildSummary || action.offerBuild)) {
        appendAi(action.reply);
        setPendingAction(action);
        setOpen(true);
        return;
      }
      if (action.intent === 'build') {
        appendAi(action.reply);
        setPendingAction(action);
        setOpen(true);
        return;
      }
      setPendingAction(null);
      appendAi(action.reply);
    },
    [appendAi, navigate, setExpanded]
  );

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', content: trimmed, at: new Date().toISOString() },
      ]);
      setInput('');
      setLoading(true);
      setOpen(true);

      try {
        const history: ChatTurn[] = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-12)
          .map((m) => ({ role: m.role === 'ai' ? 'ai' : 'user', content: m.content }));

        let result = await sendHomeAssistantTurn(history, trimmed);

        if (result.ok && result.action.needsWebSearch && result.action.webSearchQuery?.trim()) {
          const search = await runHomeAssistantWebSearch(result.action.webSearchQuery.trim());
          if (search.ok) {
            const enriched = `${trimmed}\n\n[WEB SEARCH]\n${search.summary}\n${search.data}`.slice(0, 12000);
            result = await sendHomeAssistantTurn(history, enriched);
          } else if (!search.ok && search.needPayment) {
            appendAi(
              `${result.action.reply}\n\nWeb search needs Hive credits (~$${(search.amountUsd ?? 0.03).toFixed(2)}). Open Settings to add credits.`
            );
            return;
          }
        }

        if (!result.ok) {
          appendAi(
            result.needPayment
              ? `This needs Hive credits (~$${(result.amountUsd ?? 0.02).toFixed(2)}). Visit /app/settings to learn about plans.`
              : result.error || 'Bhive Builder is reconnecting — try again.'
          );
          return;
        }
        await handleAction(result.action);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, appendAi, handleAction]
  );

  const panel = (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-bee-amber text-bee-black font-medium'
                  : 'bg-white/10 text-slate-200 border border-white/10'
              }`}
            >
              {m.content.replace(/\*\*/g, '')}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-bee-amber" />
            Thinking…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {pendingAction ? (
        <div className="px-4 pb-2 space-y-2 border-t border-white/10 bg-black/20">
          {pendingAction.guideSteps?.map((step, i) => (
            <p key={i} className="text-xs text-slate-400">
              {i + 1}. {step.replace(/\*\*/g, '')}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            {pendingAction.toolkitAppId ? (
              <button
                type="button"
                className="px-3 py-2 rounded-xl bg-bee-amber text-bee-black text-xs font-extrabold"
                onClick={async () => {
                  const userId = getOrCreateWebHiveUserId();
                  const installed = await installToolkitApp(pendingAction.toolkitAppId!, userId);
                  setPendingAction(null);
                  if (installed?.app) {
                    appendAi(`${installed.app.title} installed — opening now.`);
                    navigate(`/hive-apps/run/${installed.sourceAppId || installed.app.id}`);
                  } else {
                    appendAi('Install did not complete — browse My Apps to try again.');
                    navigate('/hive-apps');
                  }
                }}
              >
                Install {pendingAction.toolkitTitle || 'free app'}
              </button>
            ) : null}
            {(pendingAction.offerBuild ||
              pendingAction.buildStage === 'propose' ||
              pendingAction.intent === 'build') &&
            (pendingAction.buildMessage || pendingAction.buildSummary || pendingAction.offerBuild) ? (
              <button
                type="button"
                className="px-3 py-2 rounded-xl border border-white/20 text-white text-xs font-bold"
                onClick={() => {
                  const prefill = pendingAction.buildMessage || pendingAction.buildSummary || input;
                  setPendingAction(null);
                  navigate(`/hive-apps/build?q=${encodeURIComponent(prefill)}`);
                }}
              >
                Build custom
              </button>
            ) : null}
            {pendingAction.intent === 'research' || pendingAction.intelIntent ? (
              <button
                type="button"
                className="px-3 py-2 rounded-xl border border-white/20 text-white text-xs font-bold"
                onClick={() => {
                  setPendingAction(null);
                  navigate(
                    `/app/research?intent=${encodeURIComponent(pendingAction.intelIntent || input)}`
                  );
                }}
              >
                Run research
              </button>
            ) : null}
            <button
              type="button"
              className="px-3 py-2 text-slate-500 text-xs"
              onClick={() => setPendingAction(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="p-3 border-t border-white/10 bg-black/30">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => void submit(q.text)}
              className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-[11px] font-semibold hover:bg-white/10"
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={dockMode === 'top' && !expanded ? 1 : 2}
            placeholder="Ask anything — research, build, jobs…"
            disabled={loading}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-bee-amber/50 disabled:opacity-50 min-h-[40px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-bee-amber text-bee-black disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;

  if (dockMode === 'top') {
    return createPortal(
      <div
        data-tour="hive-assistant"
        className="fixed left-0 right-0 z-40 border-b border-bee-amber/25 bg-[#050810]/95 backdrop-blur-xl shadow-lg"
        style={{ top: '5rem' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3" style={{ minHeight: TOP_BAR_HEIGHT }}>
            <button
              type="button"
              onClick={() => {
                setExpanded(!expanded);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 shrink-0 text-bee-amber font-bold text-sm"
            >
              <Bot className="w-5 h-5" />
              Bhive Builder
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {!expanded ? (
              <p className="text-slate-400 text-xs truncate flex-1 hidden sm:block">
                {messages[messages.length - 1]?.content.slice(0, 120).replace(/\*\*/g, '') || WELCOME}
              </p>
            ) : null}
            {!expanded ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
                className="flex-1 flex gap-2 max-w-xl ml-auto"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Bhive Builder…"
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-bee-amber/40"
                />
                <button type="submit" disabled={loading || !input.trim()} className="text-bee-amber p-1.5">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : null}
          </div>
          <AnimatePresence>
            {expanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'min(420px, 55vh)', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10 flex flex-col"
              >
                {panel}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      data-tour="hive-assistant"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9998] flex flex-col items-end"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="bg-[#050810] border border-bee-amber/30 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] w-[min(100vw-2rem,26rem)] h-[32rem] flex flex-col overflow-hidden mb-3"
          >
            <div className="p-4 border-b border-bee-amber/20 flex justify-between items-center bg-bee-amber/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-bee-amber" />
                <span className="text-white font-bold">Bhive Builder</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {panel}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-bee-amber text-bee-black font-extrabold shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:bg-bee-yellow transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Ask Bhive
      </button>
    </div>,
    document.body
  );
}

/** Spacer so page content clears the top assistant bar */
export function AssistantTopSpacer() {
  const { dockMode, expanded, topBarHeight } = useAssistantDock();
  const [expandedH, setExpandedH] = useState(420);

  useEffect(() => {
    const update = () => setExpandedH(Math.min(420, window.innerHeight * 0.55));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (dockMode !== 'top') return null;
  const h = expanded ? topBarHeight + expandedH : topBarHeight;
  return <div aria-hidden style={{ height: h }} />;
}
