import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Phone, PhoneOff, Radio } from 'lucide-react';
import {
  PROS_GROK_VOICE_PHONE_DISPLAY,
  PROS_GROK_VOICE_TEL,
} from '../../config/prosVoiceContact';
import { startProsGrokVoiceCall } from '../../lib/grokVoiceCall';
import { createProsVoiceSession } from '../../lib/prosVoiceApi';

const CALL_STATUS: Record<string, string> = {
  idle: '',
  connecting: 'Connecting to Grok…',
  listening: 'Listening — ask about dispatch, Diagnose, or a trade',
  thinking: 'Thinking…',
  speaking: 'Pros AI is speaking',
  error: 'Call issue',
};

export default function ProsVoiceCallPanel() {
  const [open, setOpen] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const callRef = useRef<ReturnType<typeof startProsGrokVoiceCall> | null>(null);

  const inCall = callStatus !== 'idle' && callStatus !== 'error';

  const hangup = useCallback(() => {
    callRef.current?.hangup();
    callRef.current = null;
    setCallStatus('idle');
    setMuted(false);
  }, []);

  useEffect(() => () => hangup(), [hangup]);

  const appendTranscript = useCallback(
    (entry: { role?: string; content?: string }) => {
      const text = entry?.content?.trim();
      if (!text) return;
      setTranscript((prev) => [...prev.slice(-12), { role: entry.role || 'assistant', content: text }]);
    },
    [],
  );

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
    <>
      {open ? (
        <div
          className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden"
          role="dialog"
          aria-label="AiBhive Pros voice assistant"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
            <div>
              <div className="font-bold text-sm">Pros Grok Voice</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {inCall ? CALL_STATUS[callStatus] || 'On call' : 'Browser demo · same agent as the phone line'}
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg px-2 py-1 text-slate-400 hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {inCall ? (
            <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {muted ? 'Muted — AI cannot hear you' : CALL_STATUS[callStatus] || 'On call'}
            </div>
          ) : null}

          <div className="max-h-40 overflow-y-auto px-4 py-3 space-y-2 text-sm">
            {transcript.length === 0 ? (
              <p className="text-slate-500 text-xs leading-relaxed">
                Ask about dispatch, Diagnose, HVAC/plumbing playbooks, or how Pros HQ works. Or dial{' '}
                <a href={PROS_GROK_VOICE_TEL} className="font-semibold text-[#c47d00] hover:underline">
                  {PROS_GROK_VOICE_PHONE_DISPLAY}
                </a>{' '}
                from any phone.
              </p>
            ) : (
              transcript.map((line, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    line.role === 'user' ? 'bg-slate-100 text-slate-800 ml-4' : 'bg-amber-50 text-slate-800 mr-4'
                  }`}
                >
                  {line.content}
                </div>
              ))
            )}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50">
            {inCall ? (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
                  Talk in browser
                </button>
                <a
                  href={PROS_GROK_VOICE_TEL}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
        className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full font-bold px-5 py-3 shadow-lg transition-colors ${
          inCall
            ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse'
            : 'bg-slate-900 text-white shadow-slate-900/25 hover:bg-slate-800'
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close Pros voice panel' : 'Open Pros Grok voice'}
      >
        {inCall ? <Radio className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        {inCall ? 'On call' : 'Talk to Pros AI'}
      </button>
    </>
  );
}
