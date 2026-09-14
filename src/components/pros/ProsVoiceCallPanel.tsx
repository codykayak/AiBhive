import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Mic, MicOff, Phone, PhoneOff, Radio, Sparkles } from 'lucide-react';
import { PROS_VOICE_OPEN_EVENT } from '../../lib/prosVoiceEvents';
import { startProsGrokVoiceCall } from '../../lib/grokVoiceCall';
import { createProsVoiceSession } from '../../lib/prosVoiceApi';

type TranscriptLine = {
  role: string;
  content: string;
  itemId?: string;
  channel?: string;
};

const CALL_STATUS: Record<string, string> = {
  idle: '',
  connecting: 'Connecting to AiBhive Voice…',
  listening: 'Listening — ask about dispatch, Diagnose, or a trade',
  thinking: 'Thinking…',
  speaking: 'Pros AI is speaking',
  error: 'Call issue',
};

/** Same upsert logic as ManyDoors SiteChatbot — partial STT updates replace one bubble, not stack. */
function upsertVoiceTranscript(prev: TranscriptLine[], entry: TranscriptLine): TranscriptLine[] {
  const text = entry.content?.trim();
  if (!text) return prev;

  const { role, itemId } = entry;
  if (itemId) {
    const idx = prev.findLastIndex((m) => m.itemId === itemId && m.role === role);
    if (idx >= 0) {
      if (prev[idx].content === text) return prev;
      const next = [...prev];
      next[idx] = { ...prev[idx], content: text };
      return next;
    }
  }

  const last = prev[prev.length - 1];
  if (last?.channel === 'voice' && last.role === role) {
    if (last.content === text) return prev;
    const sameItem = itemId && last.itemId && itemId === last.itemId;
    const revised = text.startsWith(last.content) || last.content.startsWith(text);
    if (sameItem || revised) {
      return [
        ...prev.slice(0, -1),
        { ...last, content: text, itemId: itemId || last.itemId },
      ];
    }
  }

  if (prev.slice(-8).some((m) => m.role === role && m.channel === 'voice' && m.content === text)) {
    return prev;
  }

  return [...prev, { role, content: text, channel: 'voice', itemId }];
}

export default function ProsVoiceCallPanel() {
  const [open, setOpen] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const callRef = useRef<ReturnType<typeof startProsGrokVoiceCall> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const startCallRef = useRef<(() => Promise<void>) | null>(null);

  const inCall = callStatus !== 'idle' && callStatus !== 'error';

  const hangup = useCallback(() => {
    callRef.current?.hangup();
    callRef.current = null;
    setCallStatus('idle');
    setMuted(false);
  }, []);

  useEffect(() => () => hangup(), [hangup]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const shouldStart = Boolean((event as CustomEvent<{ startCall?: boolean }>).detail?.startCall);
      setOpen(true);
      if (shouldStart) {
        void startCallRef.current?.();
      }
    };
    window.addEventListener(PROS_VOICE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PROS_VOICE_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, callStatus, open]);

  const appendTranscript = useCallback((entry: { role?: string; content?: string; itemId?: string }) => {
    setTranscript((prev) =>
      upsertVoiceTranscript(prev, {
        role: entry.role || 'assistant',
        content: entry.content || '',
        itemId: entry.itemId,
      }),
    );
  }, []);

  const startCall = useCallback(async () => {
    if (inCall || callStatus === 'connecting') return;
    setError(null);
    setCallStatus('connecting');
    setOpen(true);
    try {
      const session = await createProsVoiceSession();
      const call = startProsGrokVoiceCall({
        session,
        chatHistory: [],
        onTranscript: appendTranscript,
        onStatus: (status, extra) => {
          if (status === 'idle') {
            setCallStatus('idle');
            setMuted(false);
            callRef.current = null;
            return;
          }
          if (status === 'error') {
            setError(typeof extra === 'string' ? extra : 'Voice call hit a snag.');
            setCallStatus('listening');
            return;
          }
          if (status === 'listening' || status === 'speaking') setError(null);
          setCallStatus(status);
        },
      });
      callRef.current = call;
      await call.started;
    } catch (e) {
      hangup();
      setCallStatus('idle');
      setError(e instanceof Error ? e.message : 'Could not start the voice call.');
    }
  }, [appendTranscript, callStatus, hangup, inCall]);

  startCallRef.current = startCall;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    callRef.current?.setMuted(next);
  };

  const closePanel = () => {
    hangup();
    setOpen(false);
  };

  return (
    <div
      data-tour="pros-voice-assistant"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9998] flex flex-col items-end"
    >
      {open ? (
        <div
          className="mb-3 w-[min(100vw-2rem,26rem)] h-[32rem] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
          role="dialog"
          aria-label="AiBhive Pros voice assistant"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">AiBhive Voice</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {inCall ? CALL_STATUS[callStatus] || 'On call' : 'Browser demo · same agent as your shop line'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-800 text-lg leading-none shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {inCall ? (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-xs font-medium text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {muted ? 'Muted — AI cannot hear you' : CALL_STATUS[callStatus] || 'On call'}
            </div>
          ) : null}

          <div ref={transcriptRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 text-sm bg-[#fafbfc]">
            {transcript.length === 0 ? (
              <p className="text-slate-600 text-sm leading-relaxed">
                Ask about dispatch, Diagnose, HVAC/plumbing playbooks, or how Pros HQ works. Tap{' '}
                <strong className="text-amber-700">Try Ai Voice</strong> to start a live session.
              </p>
            ) : (
              transcript.map((line, i) => (
                <div
                  key={line.itemId || `${line.role}-${i}`}
                  className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    line.role === 'user'
                      ? 'bg-slate-200 text-slate-900 ml-6'
                      : 'bg-amber-50 text-slate-800 mr-6 border border-amber-200'
                  }`}
                >
                  {line.content}
                </div>
              ))
            )}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3 bg-white">
            {inCall ? (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {muted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={hangup}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-bold text-white"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  Hang up
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startCall}
                  disabled={callStatus === 'connecting'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5A623] hover:bg-[#e09510] px-3 py-2 text-xs font-bold text-slate-900 disabled:opacity-60"
                >
                  {callStatus === 'connecting' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                  Try Ai Voice
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        className={`flex items-center gap-2 px-5 py-3.5 rounded-full font-extrabold transition-colors ${
          inCall
            ? 'bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,0.35)] animate-pulse'
            : 'bg-[#F5A623] text-slate-900 shadow-lg shadow-amber-500/25 hover:bg-[#e09510]'
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close AiBhive Voice panel' : 'Open AiBhive Voice'}
      >
        {inCall ? (
          <Radio className="w-5 h-5" />
        ) : open ? (
          <MessageCircle className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {inCall ? 'On call' : open ? 'Pros Voice' : 'Talk to Pros AI'}
      </button>
    </div>
  );
}
