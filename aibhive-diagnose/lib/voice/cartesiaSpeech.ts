import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { API_BASE } from '@/lib/config/apiBase';

const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';

let activePlayer: import('expo-audio').AudioPlayer | null = null;
let activeObjectUrl: string | null = null;
let activeCachePath: string | null = null;

function cleanTextForSpeech(text: string, maxLen = 420): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/_/g, '')
    .replace(/\n+/g, '. ')
    .trim()
    .slice(0, maxLen);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function cleanupPlaybackAssets(): Promise<void> {
  try {
    activePlayer?.pause();
    activePlayer?.remove();
  } catch {
    // ignore
  }
  activePlayer = null;

  if (activeObjectUrl) {
    try {
      URL.revokeObjectURL(activeObjectUrl);
    } catch {
      // ignore
    }
    activeObjectUrl = null;
  }

  if (activeCachePath && Platform.OS !== 'web') {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      await FileSystem.deleteAsync(activeCachePath, { idempotent: true });
    } catch {
      // ignore
    }
    activeCachePath = null;
  }
}

export async function stopDiagnoseSpeech(): Promise<void> {
  Speech.stop();
  await cleanupPlaybackAssets();
}

async function playCartesiaAudio(audioBase64: string, mimeType: string): Promise<void> {
  const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });

  let source: string;
  if (Platform.OS === 'web') {
    const blob = base64ToBlob(audioBase64, mimeType);
    activeObjectUrl = URL.createObjectURL(blob);
    source = activeObjectUrl;
  } else {
    const FileSystem = await import('expo-file-system/legacy');
    const path = `${FileSystem.cacheDirectory}cartesia-${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(path, audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    activeCachePath = path;
    source = path;
  }

  const player = createAudioPlayer(source);
  activePlayer = player;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      subscription.remove();
      if (err) reject(err);
      else resolve();
    };

    const subscription = player.addListener(PLAYBACK_STATUS_UPDATE, (status) => {
      if (status.didJustFinish) {
        finish();
      }
    });

    try {
      player.play();
    } catch (err) {
      finish(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    // Safety timeout — long replies should still finish well under this.
    setTimeout(() => finish(), 120_000);
  });
}

function speakWithDeviceTts(
  spoken: string,
  onDone?: () => void,
  onError?: () => void
): void {
  Speech.speak(spoken, {
    rate: 0.95,
    pitch: 0.95,
    onDone,
    onStopped: onDone,
    onError,
  });
}

/**
 * Speak a Diagnose assistant reply.
 * Uses Cartesia (server) when Pros AI + cartesia are enabled; otherwise device TTS.
 */
export async function speakDiagnoseReply(opts: {
  text: string;
  useCartesia: boolean;
  getIdToken?: () => Promise<string | null>;
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
}): Promise<void> {
  const spoken = cleanTextForSpeech(opts.text);
  if (!spoken) {
    opts.onDone?.();
    return;
  }

  await stopDiagnoseSpeech();
  opts.onStart?.();

  const finish = () => {
    void cleanupPlaybackAssets();
    opts.onDone?.();
  };
  const fail = () => {
    void cleanupPlaybackAssets();
    opts.onError?.();
  };

  if (opts.useCartesia && opts.getIdToken && API_BASE) {
    try {
      const token = await opts.getIdToken();
      if (!token) throw new Error('Sign in required');

      const res = await fetch(`${API_BASE}/api/pros/tts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: spoken }),
      });

      if (!res.ok) {
        throw new Error(`TTS ${res.status}`);
      }

      const payload = (await res.json()) as { audioBase64?: string; mimeType?: string };
      if (!payload.audioBase64) {
        throw new Error('Empty TTS audio');
      }

      await playCartesiaAudio(payload.audioBase64, payload.mimeType || 'audio/wav');
      finish();
      return;
    } catch {
      // Fall through to device TTS
    }
  }

  speakWithDeviceTts(spoken, finish, fail);
}
