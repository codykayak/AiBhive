import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { API_BASE } from '@/lib/config/apiBase';
import {
  DEFAULT_GROK_VOICE_ID,
  DEFAULT_TTS_PROVIDER,
  loadVoicePreferences,
  type TtsProvider,
} from '@/lib/voice/voicePreferences';

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

function toPlaybackUri(path: string): string {
  if (path.startsWith('file://') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `file://${path}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'wav';
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

async function waitForPlayerLoaded(
  player: import('expo-audio').AudioPlayer,
  timeoutMs = 15000
): Promise<void> {
  const started = Date.now();
  while (!player.isLoaded && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  if (!player.isLoaded) {
    throw new Error('Audio failed to load');
  }
}

async function playServerAudio(audioBase64: string, mimeType: string): Promise<void> {
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
    const ext = extensionForMime(mimeType);
    const path = `${FileSystem.cacheDirectory}tts-${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(path, audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    activeCachePath = path;
    source = toPlaybackUri(path);
  }

  const player = createAudioPlayer({ uri: source }, { downloadFirst: Platform.OS !== 'web' });
  activePlayer = player;
  await waitForPlayerLoaded(player);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let heardAudio = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      subscription.remove();
      if (err) reject(err);
      else resolve();
    };

    const subscription = player.addListener(PLAYBACK_STATUS_UPDATE, (status) => {
      if (status.playing || status.currentTime > 0.05) {
        heardAudio = true;
      }
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

    setTimeout(() => {
      if (settled) return;
      if (!heardAudio && !player.playing) {
        finish(new Error('Audio never started'));
      }
    }, 8000);

    setTimeout(() => {
      if (settled) return;
      if (heardAudio) finish();
      else finish(new Error('Audio playback timed out'));
    }, 120_000);
  });
}

async function fetchServerTts(opts: {
  text: string;
  provider: TtsProvider;
  voiceId: string;
  getIdToken: () => Promise<string | null>;
  preview?: boolean;
}): Promise<{ audioBase64: string; mimeType: string }> {
  const token = await opts.getIdToken();
  if (!token) throw new Error('Sign in required');

  const res = await fetch(`${API_BASE}/api/pros/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: opts.text,
      provider: opts.provider,
      voiceId: opts.voiceId,
      preview: Boolean(opts.preview),
    }),
  });

  if (!res.ok) {
    throw new Error(`TTS ${res.status}`);
  }

  const payload = (await res.json()) as { audioBase64?: string; mimeType?: string };
  if (!payload.audioBase64) {
    throw new Error('Empty TTS audio');
  }

  return {
    audioBase64: payload.audioBase64,
    mimeType: payload.mimeType || 'audio/mpeg',
  };
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

export async function previewVoice(opts: {
  provider: TtsProvider;
  voiceId: string;
  getIdToken: () => Promise<string | null>;
}): Promise<void> {
  if (opts.provider === 'device') {
    speakWithDeviceTts('This is your phone voice. Grok voices need Pros AI.');
    return;
  }

  await stopDiagnoseSpeech();
  const audio = await fetchServerTts({
    text: '',
    provider: opts.provider,
    voiceId: opts.voiceId,
    getIdToken: opts.getIdToken,
    preview: true,
  });
  await playServerAudio(audio.audioBase64, audio.mimeType);
  await cleanupPlaybackAssets();
}

/**
 * Speak a Diagnose assistant reply using Grok (default), Cartesia, or device TTS.
 */
export async function speakDiagnoseReply(opts: {
  text: string;
  useServerTts?: boolean;
  provider?: TtsProvider;
  voiceId?: string;
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

  if (opts.useServerTts && opts.getIdToken && API_BASE) {
    try {
      const prefs = await loadVoicePreferences();
      const provider = opts.provider ?? prefs.provider ?? DEFAULT_TTS_PROVIDER;
      if (provider !== 'device') {
        const voiceId = opts.voiceId ?? prefs.grokVoiceId ?? DEFAULT_GROK_VOICE_ID;
        const audio = await fetchServerTts({
          text: spoken,
          provider,
          voiceId,
          getIdToken: opts.getIdToken,
        });
        await playServerAudio(audio.audioBase64, audio.mimeType);
        finish();
        return;
      }
    } catch {
      // Fall through to device TTS
    }
  }

  speakWithDeviceTts(spoken, finish, fail);
}
