import { Platform } from 'react-native';
import { API_BASE } from '@/lib/config/apiBase';

const DEFAULT_SILENCE_MS = 4000;
const SPEECH_LEVEL_DB = -42;
const SILENCE_LEVEL_DB = -50;

type WebSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WebSpeechCtor = new () => WebSpeechRecognition;

function getWebSpeechCtor(): WebSpeechCtor | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechCtor;
    webkitSpeechRecognition?: WebSpeechCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function supportsLiveSpeech(): boolean {
  return Boolean(getWebSpeechCtor());
}

export type VoiceSession = {
  stop: () => Promise<string>;
  cancel: () => Promise<void>;
};

export type VoiceCaptureOptions = {
  getIdToken?: () => Promise<string | null>;
  onPartial?: (text: string) => void;
  /** When set, auto-stop after this much silence and invoke with the transcript. */
  onAutoSend?: (text: string) => void;
  vadSilenceMs?: number;
};

/**
 * Start voice capture with optional VAD auto-send (default 4s silence).
 * - Web: live SpeechRecognition when available
 * - Native: expo-audio recording + metering VAD → Pros `/api/pros/transcribe`
 */
export async function startVoiceCapture(opts: VoiceCaptureOptions): Promise<VoiceSession> {
  const WebSpeech = getWebSpeechCtor();
  if (WebSpeech) {
    return startWebSpeech(WebSpeech, opts);
  }
  return startRecordingSession(opts);
}

function startWebSpeech(Ctor: WebSpeechCtor, opts: VoiceCaptureOptions): VoiceSession {
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  let finalText = '';
  let lastSpeechAt = Date.now();
  let cancelled = false;
  let autoSent = false;
  const silenceMs = opts.vadSilenceMs ?? DEFAULT_SILENCE_MS;

  let vadTimer: ReturnType<typeof setInterval> | null = null;
  if (opts.onAutoSend) {
    vadTimer = setInterval(() => {
      if (cancelled || autoSent) return;
      if (!finalText.trim()) return;
      if (Date.now() - lastSpeechAt >= silenceMs) {
        autoSent = true;
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        const text = finalText.trim();
        if (text) opts.onAutoSend?.(text);
      }
    }, 250);
  }

  recognition.onresult = (event) => {
    let interim = '';
    let finals = '';
    for (let i = 0; i < event.results.length; i++) {
      const piece = event.results[i]?.[0]?.transcript || '';
      finals += piece + ' ';
      interim = piece;
    }
    const next = finals.trim() || interim.trim();
    if (next) {
      finalText = next;
      lastSpeechAt = Date.now();
      opts.onPartial?.(finalText);
    }
  };

  recognition.onerror = () => undefined;
  recognition.onend = () => undefined;
  recognition.start();

  const clearVad = () => {
    if (vadTimer) {
      clearInterval(vadTimer);
      vadTimer = null;
    }
  };

  return {
    stop: async () => {
      clearVad();
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      await new Promise((r) => setTimeout(r, 280));
      return finalText.trim();
    },
    cancel: async () => {
      cancelled = true;
      clearVad();
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
  };
}

async function startRecordingSession(opts: VoiceCaptureOptions): Promise<VoiceSession> {
  let recording: import('expo-audio').AudioRecorder | null = null;
  let vadTimer: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;
  let autoSent = false;
  let finishing = false;
  let heardSpeech = false;
  let silenceAccumMs = 0;
  const silenceMs = opts.vadSilenceMs ?? DEFAULT_SILENCE_MS;

  const finishRecording = async (transcribe: boolean): Promise<string> => {
    if (finishing) return '';
    finishing = true;
    if (vadTimer) {
      clearInterval(vadTimer);
      vadTimer = null;
    }
    try {
      await recording?.stop();
    } catch {
      // already stopped
    }
    try {
      const { setAudioModeAsync } = await import('expo-audio');
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // ignore
    }
    if (!transcribe || cancelled) return '';

    const uri = recording?.uri;
    if (!uri) throw new Error('Recording failed — try again.');

    const token = opts.getIdToken ? await opts.getIdToken() : null;
    if (!token || !API_BASE) {
      throw new Error(
        'Voice transcription needs Pros sign-in. Type the fault, or sign in under Account.'
      );
    }

    const base64 = await uriToBase64(uri);
    const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
    const res = await fetch(`${API_BASE}/api/pros/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioBase64: base64, mimeType }),
    });

    if (!res.ok) {
      const text = await res.text();
      let msg = 'Transcription failed.';
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed?.error) msg = parsed.error;
      } catch {
        // keep
      }
      throw new Error(msg);
    }

    const data = (await res.json()) as { text?: string };
    return (data.text || '').trim();
  };

  try {
    const {
      AudioModule,
      RecordingPresets,
      requestRecordingPermissionsAsync,
      setAudioModeAsync,
    } = await import('expo-audio');

    if (!AudioModule?.AudioRecorder) {
      throw new Error(
        'Voice input is not available in this preview. Type your fault in the chat box instead.'
      );
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission is required for voice input.');
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    recording = new AudioModule.AudioRecorder({
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });
    await recording.prepareToRecordAsync();
    recording.record();

    if (opts.onAutoSend) {
      let lastTick = Date.now();
      vadTimer = setInterval(() => {
        if (cancelled || autoSent || finishing || !recording) return;
        const now = Date.now();
        const delta = now - lastTick;
        lastTick = now;

        const status = recording.getStatus();
        const level = status.metering;
        if (typeof level === 'number') {
          if (level >= SPEECH_LEVEL_DB) {
            heardSpeech = true;
            silenceAccumMs = 0;
          } else if (heardSpeech && level <= SILENCE_LEVEL_DB) {
            silenceAccumMs += delta;
          } else if (!heardSpeech) {
            silenceAccumMs = 0;
          }
        }

        if (heardSpeech && silenceAccumMs >= silenceMs) {
          autoSent = true;
          void finishRecording(true)
            .then((text) => {
              if (text) opts.onAutoSend?.(text);
            })
            .catch(() => {
              autoSent = false;
              finishing = false;
            });
        }
      }, 200);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Cannot find native module') || message.includes('ExponentAV')) {
      throw new Error(
        'Voice input needs the updated app build. Type your fault in the chat box for now.'
      );
    }
    throw err;
  }

  return {
    stop: () => finishRecording(true),
    cancel: async () => {
      cancelled = true;
      await finishRecording(false);
    },
  };
}

async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error('Could not read recording'));
      reader.readAsDataURL(blob);
    });
  }

  const FileSystem = await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}
