import AsyncStorage from '@react-native-async-storage/async-storage';

export type TtsProvider = 'grok' | 'cartesia' | 'device';

export const DEFAULT_TTS_PROVIDER: TtsProvider = 'grok';
export const DEFAULT_GROK_VOICE_ID = 'ara';

const PROVIDER_KEY = 'aibhive.diagnose.ttsProvider';
const VOICE_KEY = 'aibhive.diagnose.grokVoiceId';

export type VoicePreferences = {
  provider: TtsProvider;
  grokVoiceId: string;
};

export async function loadVoicePreferences(): Promise<VoicePreferences> {
  try {
    const [providerRaw, voiceId] = await Promise.all([
      AsyncStorage.getItem(PROVIDER_KEY),
      AsyncStorage.getItem(VOICE_KEY),
    ]);
    const provider =
      providerRaw === 'cartesia' || providerRaw === 'device' || providerRaw === 'grok'
        ? providerRaw
        : DEFAULT_TTS_PROVIDER;
    return {
      provider,
      grokVoiceId: voiceId?.trim() || DEFAULT_GROK_VOICE_ID,
    };
  } catch {
    return { provider: DEFAULT_TTS_PROVIDER, grokVoiceId: DEFAULT_GROK_VOICE_ID };
  }
}

export async function saveVoicePreferences(prefs: VoicePreferences): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(PROVIDER_KEY, prefs.provider),
    AsyncStorage.setItem(VOICE_KEY, prefs.grokVoiceId.trim().toLowerCase() || DEFAULT_GROK_VOICE_ID),
  ]);
}

export type GrokVoiceMeta = {
  id: string;
  name: string;
  description: string;
};

export type TtsVoicesResponse = {
  defaultProvider: TtsProvider;
  defaultVoiceId: string;
  grokAvailable: boolean;
  cartesiaAvailable: boolean;
  grokVoices: GrokVoiceMeta[];
};
