import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

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

/**
 * Start voice capture.
 * - Web: live SpeechRecognition when available
 * - Native / fallback: expo-audio recording → Pros `/api/pros/transcribe`
 *
 * expo-audio is required lazily so a missing native module cannot crash app boot.
 */
export async function startVoiceCapture(opts: {
  getIdToken?: () => Promise<string | null>;
  onPartial?: (text: string) => void;
}): Promise<VoiceSession> {
  const WebSpeech = getWebSpeechCtor();
  if (WebSpeech) {
    return startWebSpeech(WebSpeech, opts.onPartial);
  }
  return startRecordingSession(opts.getIdToken);
}

function startWebSpeech(
  Ctor: WebSpeechCtor,
  onPartial?: (text: string) => void
): VoiceSession {
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  let finalText = '';

  recognition.onresult = (event) => {
    let interim = '';
    let finals = '';
    for (let i = 0; i < event.results.length; i++) {
      const piece = event.results[i]?.[0]?.transcript || '';
      finals += piece + ' ';
      interim = piece;
    }
    finalText = finals.trim() || interim.trim();
    if (finalText) onPartial?.(finalText);
  };

  recognition.onerror = () => undefined;
  recognition.onend = () => undefined;
  recognition.start();

  return {
    stop: async () => {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      await new Promise((r) => setTimeout(r, 280));
      return finalText.trim();
    },
    cancel: async () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
  };
}

async function startRecordingSession(
  getIdToken?: () => Promise<string | null>
): Promise<VoiceSession> {
  // Dynamic import keeps expo-audio off the critical boot path (SDK 57+ — expo-av removed).
  let recording: import('expo-audio').AudioRecorder | null = null;
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

    recording = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recording.prepareToRecordAsync();
    recording.record();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Cannot find native module') || message.includes('ExponentAV')) {
      throw new Error(
        'Voice input needs the updated app build. Type your fault in the chat box for now.'
      );
    }
    throw err;
  }

  const finish = async (transcribe: boolean): Promise<string> => {
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
    if (!transcribe) return '';

    const uri = recording?.uri;
    if (!uri) throw new Error('Recording failed — try again.');

    const token = getIdToken ? await getIdToken() : null;
    if (!token || !API_BASE) {
      throw new Error(
        'Recording works in Expo Go, but speech-to-text needs Pros sign-in or the field APK. Type your fault for now.'
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

  return {
    stop: () => finish(true),
    cancel: () => finish(false).then(() => undefined),
  };
}

async function uriToBase64(uri: string): Promise<string> {
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
