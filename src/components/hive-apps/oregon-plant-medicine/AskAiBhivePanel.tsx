import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import {
  PlantCreditsError,
  sendLivingKnowledgeChat,
  type PlantChatMessage,
  type TopicLibraryId,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';

export type AskAiContext = {
  focusTitle: string;
  contextText: string;
  plantId?: string;
  essayId?: string;
  library?: TopicLibraryId;
  topicId?: string;
};

type Props = {
  context: AskAiContext;
  user: User | null;
  onSignIn: () => void;
  onClose: () => void;
};

type StoredMessage = PlantChatMessage & { id: string };

function sessionKey(ctx: AskAiContext) {
  return `lk_ask_${ctx.plantId ?? ctx.essayId ?? `${ctx.library}-${ctx.topicId}`}`;
}

function loadSession(ctx: AskAiContext): StoredMessage[] {
  try {
    const raw = localStorage.getItem(sessionKey(ctx));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSession(ctx: AskAiContext, messages: StoredMessage[]) {
  localStorage.setItem(sessionKey(ctx), JSON.stringify(messages.slice(-40)));
}

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AskAiBhivePanel({ context, user, onSignIn, onClose }: Props) {
  const [messages, setMessages] = useState<StoredMessage[]>(() => loadSession(context));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadSession(context));
  }, [context]);

  useEffect(() => {
    saveSession(context, messages);
  }, [context, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      if (!user) {
        onSignIn();
        return;
      }

      const userMsg: StoredMessage = { id: newId(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setBusy(true);
      setError('');

      try {
        const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const result = await sendLivingKnowledgeChat(user, {
          message: trimmed,
          history,
          plantId: context.plantId,
          essayId: context.essayId,
          library: context.library,
          topicId: context.topicId,
          contextText: context.contextText,
          focusTitle: context.focusTitle,
        });
        setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: result.reply }]);
      } catch (e) {
        if (e instanceof PlantCreditsError) {
          setError(e.message || 'Hive credits depleted — add credits to continue.');
        } else {
          setError(e instanceof Error ? e.message : 'Ask AiBhive failed');
        }
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(trimmed);
      } finally {
        setBusy(false);
      }
    },
    [busy, user, onSignIn, messages, context],
  );

  const buyCredits = async () => {
    setCheckoutBusy(true);
    try {
      const url = await startLivingKnowledgeCreditsCheckout(3);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-violet-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AiBhive
            </p>
            <p className="text-sm font-bold text-white mt-1 line-clamp-1">{context.focusTitle}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Uses Hive credits per message</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500 leading-relaxed">
              Dig deeper into this topic — identification tips, safety, traditions, or what to research next.
            </p>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-8 bg-violet-600/20 border border-violet-500/30 text-violet-100'
                  : 'mr-4 bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy ? (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {error ? (
            <div className="text-xs text-red-300 space-y-2">
              <p>{error}</p>
              {error.includes('credit') ? (
                <button
                  type="button"
                  disabled={checkoutBusy}
                  onClick={() => void buyCredits()}
                  className="text-violet-300 underline hover:text-violet-200"
                >
                  Add Hive credits
                </button>
              ) : null}
            </div>
          ) : null}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question…"
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white p-2.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
