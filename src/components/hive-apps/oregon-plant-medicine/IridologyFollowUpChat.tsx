import type { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import type { PlantChatMessage } from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { sendIridologyFollowUpChat } from '../../../lib/oregonPlantMedicine/iridologyHistoryApi';
import { sendLivingKnowledgeChat } from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { updateLocalIridologyChat } from '../../../lib/oregonPlantMedicine/iridologyHistoryStorage';
import { HIVE_RESEARCH_LABEL } from '../../../lib/oregonPlantMedicine/branding';

type ChatMsg = PlantChatMessage & { id: string };

type Props = {
  analysisId: string;
  user: User | null;
  onSignIn: () => void;
  initialMessages?: PlantChatMessage[];
  /** Used when analysis is stored locally only (no Firestore id). */
  localContext?: string;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function IridologyFollowUpChat({
  analysisId,
  user,
  onSignIn,
  initialMessages = [],
  localContext,
}: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    initialMessages.map((m) => ({ ...m, id: uid() })),
  );
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages.map((m) => ({ ...m, id: uid() })));
  }, [analysisId]);

  const isLocal = analysisId.startsWith('local_');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const persistLocal = useCallback(
    (next: ChatMsg[]) => {
      if (!user) return;
      updateLocalIridologyChat(
        user.uid,
        analysisId,
        next.map(({ role, content }) => ({ role, content })),
      );
    },
    [analysisId, user],
  );

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    if (!user) {
      onSignIn();
      setError('Sign in to ask follow-up questions about your iris analysis.');
      return;
    }

    const userMsg: ChatMsg = { id: uid(), role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');

    try {
      const history = next.slice(0, -1).map(({ role, content }) => ({ role, content }));
      let replyText: string;
      if (isLocal && localContext) {
        const result = await sendLivingKnowledgeChat(user, {
          message: trimmed,
          context: localContext,
          scope: 'iridology',
          history,
        });
        replyText = result.reply;
      } else {
        const result = await sendIridologyFollowUpChat(user, analysisId, {
          message: trimmed,
          history,
        });
        replyText = result.reply;
      }
      const assistantMsg: ChatMsg = { id: uid(), role: 'assistant', content: replyText };
      const withReply = [...next, assistantMsg];
      setMessages(withReply);
      persistLocal(withReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
      setMessages(messages);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    'What does my constitutional type mean in plain language?',
    'Which observations had the lowest confidence and why?',
    'How should I retake the photo for better fiber detail?',
    'What would integrated iridology say vs Jensen zones here?',
  ];

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Ask about your analysis</h3>
          <p className="text-[11px] text-slate-400">
            Follow-up chat references your saved report · {HIVE_RESEARCH_LABEL} · educational only
          </p>
        </div>
      </div>

      {messages.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'ml-8 bg-indigo-600/25 border border-indigo-500/25 text-indigo-50'
                  : 'mr-6 bg-slate-800/80 border border-slate-700 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
          placeholder="Ask a follow-up about your iris report…"
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500/50"
        />
        <button
          type="button"
          disabled={busy || !input.trim()}
          onClick={() => void send()}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
    </div>
  );
}
