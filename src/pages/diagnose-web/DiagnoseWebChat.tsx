import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImagePlus, Loader2, Mic, Send, Sparkles } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { askDiagnoseWeb } from '../../lib/diagnoseWeb/askDiagnose';
import {
  fileToAttachment,
  loadChatSession,
  saveChatSession,
  type ChatAttachment,
} from '../../lib/diagnoseWeb/api';
import { DiagnoseMarkdown } from '../../lib/diagnoseWeb/markdown';
import type { DiagnoseWebMessage } from '../../lib/diagnoseWeb/types';
import { DiagnoseCreditsError } from '../../lib/diagnoseWeb/types';
import { cn } from '../../lib/utils';

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function DiagnoseWebChat() {
  const { activePack, idToken, refreshAccount, setCreditsDepletedOpen } = useDiagnoseWeb();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<DiagnoseWebMessage[]>(() => loadChatSession(activePack.id));
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [useLiveAi, setUseLiveAi] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(loadChatSession(activePack.id));
  }, [activePack.id]);

  useEffect(() => {
    saveChatSession(activePack.id, messages);
  }, [activePack.id, messages]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) setInput(prompt);
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed && !attachment) return;

      const userMsg: DiagnoseWebMessage = {
        id: newId(),
        role: 'user',
        content: trimmed || '(Photo attached)',
        createdAt: Date.now(),
        attachmentPreview: attachment?.previewUrl,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setBusy(true);

      try {
        const result = await askDiagnoseWeb({
          pack: activePack,
          messages: [...messages, userMsg],
          userText: trimmed || 'Diagnose this equipment photo.',
          attachment,
          idToken,
          useLiveAi,
        });

        const assistantMsg: DiagnoseWebMessage = {
          id: newId(),
          role: 'assistant',
          content: result.reply,
          createdAt: Date.now(),
          source: result.source,
          matchedFaultIds: result.matchedFaultIds,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (result.creditBalanceUsd != null) void refreshAccount();
      } catch (err) {
        if (err instanceof DiagnoseCreditsError) {
          setCreditsDepletedOpen(true);
          const fallback = await askDiagnoseWeb({
            pack: activePack,
            messages: [...messages, userMsg],
            userText: trimmed,
            attachment,
            idToken,
            useLiveAi: false,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: 'assistant',
              content: fallback.reply,
              createdAt: Date.now(),
              source: 'local',
              matchedFaultIds: fallback.matchedFaultIds,
            },
          ]);
        }
      } finally {
        setAttachment(null);
        setBusy(false);
      }
    },
    [activePack, attachment, idToken, messages, refreshAccount, setCreditsDepletedOpen, useLiveAi]
  );

  const startVoice = () => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) void send(transcript);
    };
    rec.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-screen max-w-4xl mx-auto">
      <div className="px-4 py-4 border-b border-white/8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Diagnose</h1>
          <p className="text-xs text-slate-500">{activePack.name}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useLiveAi}
            onChange={(e) => setUseLiveAi(e.target.checked)}
            className="rounded border-white/20"
          />
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Live Grok (uses credits)
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            Describe the equipment and symptom — or attach a photo for vision diagnosis.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[90%] rounded-2xl px-4 py-3',
                m.role === 'user'
                  ? 'bg-amber-500/15 border border-amber-500/25 text-amber-50'
                  : 'bg-[#0f1520] border border-white/10'
              )}
            >
              {m.attachmentPreview && (
                <img src={m.attachmentPreview} alt="" className="rounded-lg max-h-48 mb-3 object-cover" />
              )}
              {m.role === 'assistant' ? (
                <DiagnoseMarkdown text={m.content} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              )}
              {m.source && (
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-2">
                  {m.source === 'grok' ? 'Grok AI' : 'Pack library'}
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="px-4 pb-2 flex items-center gap-3">
          <img src={attachment.previewUrl} alt="" className="h-16 rounded-lg object-cover" />
          <button type="button" onClick={() => setAttachment(null)} className="text-xs text-slate-400 hover:text-white">
            Remove photo
          </button>
        </div>
      )}

      <form
        className="p-4 border-t border-white/8 bg-[#0a0e16]"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void fileToAttachment(file).then(setAttachment);
            e.target.value = '';
          }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white"
            title="Attach photo"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={startVoice}
            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white"
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pump won't prime, ONT LOS, breaker trips…"
            className="flex-1 px-4 py-3 rounded-xl bg-[#070a10] border border-white/10 text-white placeholder:text-slate-600 text-sm"
          />
          <button
            type="submit"
            disabled={busy || (!input.trim() && !attachment)}
            className="px-4 py-3 rounded-xl bg-amber-500 text-black font-bold disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
