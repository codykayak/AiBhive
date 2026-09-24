import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { employeePortalChat } from '../../lib/employeePortalApi';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function EmployeePortalChat({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Hi — I can help with AiBhive, MacroREI, and ManyDoors AI scripts, vocabulary, and daily ops. What do you need?',
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const nextHistory = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextHistory);
    setBusy(true);
    try {
      const { reply } = await employeePortalChat(user, text, messages);
      setMessages([...nextHistory, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([
        ...nextHistory,
        { role: 'assistant', content: e instanceof Error ? e.message : 'Something went wrong.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[min(100vw-2rem,400px)] h-[min(70vh,520px)] rounded-2xl border border-bee-amber/30 bg-[#0a0f18] shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-bee-amber/10">
            <div>
              <p className="text-white font-bold text-sm">Employee assistant</p>
              <p className="text-slate-400 text-xs">AiBhive · MacroREI · ManyDoors</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-300"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed rounded-xl px-3 py-2 max-w-[95%] ${
                  m.role === 'user'
                    ? 'ml-auto bg-bee-amber text-bee-black font-medium'
                    : 'mr-auto bg-white/5 text-slate-200 border border-white/10'
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
              placeholder="Ask about scripts, products, compliance…"
              className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              className="rounded-xl bg-bee-amber text-bee-black p-2 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-4 sm:right-6 z-[60] flex items-center gap-2 rounded-full bg-bee-amber text-bee-black pl-4 pr-5 py-3 font-bold shadow-lg shadow-bee-amber/30 hover:scale-[1.02] transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        {open ? 'Close' : 'Ask AI'}
      </button>
    </>
  );
}
