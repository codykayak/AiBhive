import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Mic, MicOff, Phone, PhoneOff, Radio, Sparkles } from 'lucide-react';
import {
  PROS_GROK_VOICE_PHONE_DISPLAY,
  PROS_GROK_VOICE_TEL,
} from '../../config/prosVoiceContact';
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
  connecting: 'Connecting to Grok…',
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

  const inCall = callStatus !== 'idle' && callStatus !== 'error';

  const hangup = useCallback(() => {
    callRef.current?.hangup();
    callRef.current = null;
    setCallStatus('idle');
    setMuted(false);
  }, []);

  useEffect(() => () => hangup(), [hangup]);

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
          className="mb-3 w-[min(100vw-2rem,26rem)] h-[32rem] flex flex-col overflow-hidden rounded-2xl border border-bee-amber/30 bg-[#050810] shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          role="dialog"
          aria-label="AiBhive Pros voice assistant"
        >
          <div className="flex items-center justify-between gap-2 border-b border-bee-amber/20 bg-bee-amber/10 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-5 h-5 text-bee-amber shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate">Pros Grok Voice</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">
                  {inCall ? CALL_STATUS[callStatus] || 'On call' : 'Browser demo · same agent as the phone line'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1 text-slate-400 hover:text-white text-lg leading-none shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {inCall ? (
            <div className="flex items-center gap-2 border-b border-bee-amber/15 bg-bee-amber/5 px-4 py-2 text-xs font-medium text-bee-amber">
              <span className="h-2 w-2 rounded-full bg-bee-amber animate-pulse" />
              {muted ? 'Muted — AI cannot hear you' : CALL_STATUS[callStatus] || 'On call'}
            </div>
          ) : null}

          <div ref={transcriptRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 text-sm">
            {transcript.length === 0 ? (
              <p className="text-slate-400 text-sm leading-relaxed">
                Ask about dispatch, Diagnose, HVAC/plumbing playbooks, or how Pros HQ works. Or dial{' '}
                <a href={PROS_GROK_VOICE_TEL} className="font-semibold text-bee-amber hover:underline">
                  {PROS_GROK_VOICE_PHONE_DISPLAY}
                </a>{' '}
                from any phone.
              </p>
            ) : (
              transcript.map((line, i) => (
                <div
                  key={line.itemId || `${line.role}-${i}`}
                  className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    line.role === 'user'
                      ? 'bg-white/10 text-slate-100 ml-6'
                      : 'bg-bee-amber/10 text-slate-100 mr-6 border border-bee-amber/20'
                  }`}
                >
                  {line.content}
                </div>
              ))
            )}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-bee-amber/20 px-4 py-3 bg-black/30">
            {inCall ? (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-bee-amber hover:bg-bee-yellow px-3 py-2 text-xs font-bold text-bee-black disabled:opacity-60"
                >
                  {callStatus === 'connecting' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                  Talk in browser
                </button>
                <a
                  href={PROS_GROK_VOICE_TEL}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {PROS_GROK_VOICE_PHONE_DISPLAY}
                </a>
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
            : 'bg-bee-amber text-bee-black shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:bg-bee-yellow'
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close Pros voice panel' : 'Open Pros Grok voice'}
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
