import { Audio } from 'expo-av';
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
 * - Native / fallback: expo-av recording → Pros `/api/pros/transcribe`
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
  let settled = false;

  recognition.onresult = (event) => {
    let interim = '';
    let finals = '';
    for (let i = 0; i < event.results.length; i++) {
      const piece = event.results[i]?.[0]?.transcript || '';
      // Web Speech marks final results; treat last chunk as interim if unknown.
      finals += piece + ' ';
      interim = piece;
    }
    finalText = finals.trim() || interim.trim();
    if (finalText) onPartial?.(finalText);
  };

  recognition.onerror = () => {
    settled = true;
  };
  recognition.onend = () => {
    settled = true;
  };

  recognition.start();

  return {
    stop: async () => {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      // Brief wait for final result callback
      await new Promise((r) => setTimeout(r, 280));
      settled = true;
      return finalText.trim();
    },
    cancel: async () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      settled = true;
    },
  };
}

async function startRecordingSession(
  getIdToken?: () => Promise<string | null>
): Promise<VoiceSession> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission is required for voice input.');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  const finish = async (transcribe: boolean): Promise<string> => {
    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // already stopped
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    if (!transcribe) return '';

    const uri = recording.getURI();
    if (!uri) throw new Error('Recording failed — try again.');

    const token = getIdToken ? await getIdToken() : null;
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
