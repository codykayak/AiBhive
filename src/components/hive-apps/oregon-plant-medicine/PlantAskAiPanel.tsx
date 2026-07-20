import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import {
  PlantCreditsError,
  sendPlantChat,
  type PlantChatMessage,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';

type Props = {
  plant: PlantEntry;
  user: User | null;
  onSignIn: () => void;
  onClose: () => void;
};

type StoredMessage = PlantChatMessage & { id: string };

const SESSION_PREFIX = 'plant_ask_ai_';

function sessionKey(plantId: string) {
  return `${SESSION_PREFIX}${plantId}`;
}

function loadSession(plantId: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(sessionKey(plantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSession(plantId: string, messages: StoredMessage[]) {
  localStorage.setItem(sessionKey(plantId), JSON.stringify(messages.slice(-40)));
}

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const STARTER_PROMPTS = [
  'How do I identify this in the field?',
  'What toxic look-alikes should I watch for?',
  'When is the best time to harvest?',
];

export default function PlantAskAiPanel({ plant, user, onSignIn, onClose }: Props) {
  const [messages, setMessages] = useState<StoredMessage[]>(() => loadSession(plant.id));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadSession(plant.id));
  }, [plant.id]);

  useEffect(() => {
    saveSession(plant.id, messages);
  }, [plant.id, messages]);

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
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setBusy(true);
      setError('');

      try {
        const history: PlantChatMessage[] = nextMessages
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content }));
        const result = await sendPlantChat(user, {
          plantId: plant.id,
          message: trimmed,
          history,
        });
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: 'assistant', content: result.reply },
        ]);
      } catch (err) {
        if (err instanceof PlantCreditsError) {
          setError('Hive credits depleted — add credits to continue.');
        } else {
          setError(err instanceof Error ? err.message : 'Ask AI failed');
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, onSignIn, plant.id, user],
  );

  const handleAddCredits = async () => {
    setCheckoutBusy(true);
    setError('');
    try {
      const url = await startLivingKnowledgeCreditsCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-emerald-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI AiBhive
            </p>
            <h3 className="text-lg font-bold text-white mt-0.5">{plant.commonName}</h3>
            <p className="text-xs text-slate-400 italic">{plant.scientificName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
            aria-label="Close Ask AI"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-300 leading-relaxed">
              <p>
                Plant-focused AI trained on our Living Knowledge library for{' '}
                <strong className="text-white">{plant.commonName}</strong> — identification, look-alikes,
                preparation, and safety. Uses Hive credits like the rest of AiBhive.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void send(prompt)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'ml-8 bg-emerald-600/25 text-emerald-50 border border-emerald-500/20'
                  : 'mr-4 bg-slate-900 text-slate-200 border border-slate-800'
              }`}
            >
              {msg.content}
            </div>
          ))}

          {busy ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              Thinking…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <div className="px-4 pb-2">
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
            {error.includes('credits') ? (
              <button
                type="button"
                onClick={() => void handleAddCredits()}
                disabled={checkoutBusy}
                className="mt-2 w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-2.5 disabled:opacity-60"
              >
                {checkoutBusy ? 'Opening checkout…' : 'Add Hive credits'}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="p-4 border-t border-white/10 shrink-0">
          {!user ? (
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm"
            >
              Sign in to Ask AI
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${plant.commonName}…`}
                disabled={busy}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Educational only — not medical advice. Always confirm ID in the field.
          </p>
        </div>
      </div>
    </div>
  );
}
