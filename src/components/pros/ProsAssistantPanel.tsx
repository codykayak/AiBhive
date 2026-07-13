import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { prosAssistantChat } from '../../lib/prosApi';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

const WELCOME =
  'Hi — I\'m your Pros HQ assistant. Ask how to dispatch jobs, track your team on the map, ingest manuals, notify techs, or anything in the user manual.';

const QUICK = [
  'How do I view where all my team members are at?',
  'How do I ingest an OEM manual?',
  'How do techs join my company?',
  'How do I export jobs to CSV?',
];

type Props = {
  user: User;
};

export default function ProsAssistantPanel({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Message = { id: `${Date.now()}-u`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBusy(true);
    try {
      const history = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await prosAssistantChat(user, text, history);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: 'assistant', content: res.reply || 'No response.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Assistant unavailable.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, [busy, input, messages, user]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-amber-500 text-black font-bold px-5 py-3 shadow-lg shadow-amber-500/25 hover:bg-amber-400"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {open ? 'Close' : 'Pros Assistant'}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-white/10 bg-[#0f141c] shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Bot className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-bold text-sm">Pros HQ Assistant</div>
              <div className="text-[11px] text-slate-500">Trained on the admin user manual</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm leading-relaxed rounded-xl px-3 py-2 ${
                  m.role === 'user'
                    ? 'ml-8 bg-amber-500/20 text-amber-100'
                    : 'mr-4 bg-white/5 text-slate-200 border border-white/10'
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 px-3 py-2 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="text-[10px] rounded-full border border-white/10 px-2 py-1 text-slate-400 hover:text-white hover:border-amber-500/40"
              >
                {q.length > 42 ? `${q.slice(0, 42)}…` : q}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
              placeholder="Ask about Pros HQ…"
              className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
              className="rounded-xl bg-amber-500 text-black p-2.5 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
