import { useRouter } from 'expo-router';
import { Check, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/config/apiBase';
import { previewVoice, stopDiagnoseSpeech } from '@/lib/voice/speechOutput';
import {
  DEFAULT_GROK_VOICE_ID,
  DEFAULT_TTS_PROVIDER,
  loadVoicePreferences,
  saveVoicePreferences,
  type GrokVoiceMeta,
  type TtsProvider,
  type TtsVoicesResponse,
  type VoicePreferences,
} from '@/lib/voice/voicePreferences';

const PROVIDERS: Array<{ id: TtsProvider; label: string; hint: string }> = [
  {
    id: 'grok',
    label: 'Grok voice (default)',
    hint: 'High-quality xAI TTS using your Pros Grok key',
  },
  {
    id: 'cartesia',
    label: 'Cartesia',
    hint: 'Premium sonic voice when enabled on the server',
  },
  {
    id: 'device',
    label: 'Phone voice',
    hint: 'Built-in text-to-speech on this device',
  },
];

export default function VoiceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getIdToken } = useAuth();
  const [prefs, setPrefs] = useState<VoicePreferences>({
    provider: DEFAULT_TTS_PROVIDER,
    grokVoiceId: DEFAULT_GROK_VOICE_ID,
  });
  const [voices, setVoices] = useState<TtsVoicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await loadVoicePreferences();
      setPrefs(stored);
      try {
        const token = await getIdToken();
        if (!token || !API_BASE) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/pros/tts/voices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setVoices((await res.json()) as TtsVoicesResponse);
        }
      } catch {
        // offline / unsigned in
      } finally {
        setLoading(false);
      }
    })();
  }, [getIdToken]);

  const providerAvailable = useCallback(
    (id: TtsProvider) => {
      if (id === 'device') return true;
      if (id === 'grok') return voices?.grokAvailable ?? false;
      if (id === 'cartesia') return voices?.cartesiaAvailable ?? false;
      return false;
    },
    [voices]
  );

  const pickProvider = async (id: TtsProvider) => {
    if (!providerAvailable(id)) return;
    const next = { ...prefs, provider: id };
    setPrefs(next);
    setSaving(true);
    try {
      await saveVoicePreferences(next);
    } finally {
      setSaving(false);
    }
  };

  const pickVoice = async (voice: GrokVoiceMeta) => {
    const next = { ...prefs, grokVoiceId: voice.id, provider: 'grok' as const };
    setPrefs(next);
    setSaving(true);
    try {
      await saveVoicePreferences(next);
    } finally {
      setSaving(false);
    }
  };

  const playPreview = async (voiceId: string) => {
    setPreviewingId(voiceId);
    try {
      await previewVoice({
        provider: prefs.provider === 'cartesia' ? 'cartesia' : 'grok',
        voiceId,
        getIdToken,
      });
    } catch {
      // ignore preview errors
    } finally {
      setPreviewingId(null);
    }
  };

  const grokVoices = voices?.grokVoices ?? [
    { id: 'ara', name: 'Ara', description: 'Warm and friendly (default)' },
    { id: 'eve', name: 'Eve', description: 'Energetic and upbeat' },
    { id: 'leo', name: 'Leo', description: 'Authoritative and strong' },
    { id: 'rex', name: 'Rex', description: 'Confident and clear' },
    { id: 'sal', name: 'Sal', description: 'Smooth and balanced' },
  ];

  return (
    <ScrollView
      className="flex-1 bg-hive-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 + insets.bottom }}
    >
      <Text className="text-2xl font-bold text-hive-mist">Voice settings</Text>
      <Text className="mt-2 text-sm leading-5 text-hive-steel">
        Choose how Diagnose reads replies aloud. Grok voice is the default when Pros AI is active.
        Mic input auto-sends after 4 seconds of silence.
      </Text>

      <Text className="mt-8 mb-3 text-xs font-bold uppercase tracking-wider text-hive-steel">
        Narration engine
      </Text>
      <View className="gap-2">
        {PROVIDERS.map((p) => {
          const available = providerAvailable(p.id);
          const selected = prefs.provider === p.id;
          return (
            <Pressable
              key={p.id}
              disabled={!available}
              onPress={() => void pickProvider(p.id)}
              className={`rounded-sm border p-4 ${selected ? 'border-hive-amber/60 bg-hive-amber/10' : 'border-hive-border bg-hive-elevated'} ${!available ? 'opacity-45' : ''}`}
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-hive-mist">{p.label}</Text>
                  <Text className="mt-1 text-xs text-hive-steel">{p.hint}</Text>
                  {!available && p.id !== 'device' ? (
                    <Text className="mt-1 text-xs text-hive-danger">Requires Pros AI + server key</Text>
                  ) : null}
                </View>
                {selected ? <Check color={theme.colors.amber} size={20} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {(prefs.provider === 'grok' || prefs.provider === 'cartesia') && (
        <>
          <Text className="mt-8 mb-3 text-xs font-bold uppercase tracking-wider text-hive-steel">
            {prefs.provider === 'grok' ? 'Grok voices' : 'Voice preview'}
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.amber} />
          ) : (
            <View className="gap-2">
              {prefs.provider === 'grok'
                ? grokVoices.map((voice) => {
                    const selected =
                      prefs.provider === 'grok' && prefs.grokVoiceId === voice.id;
                    return (
                      <View
                        key={voice.id}
                        className={`flex-row items-center gap-3 rounded-sm border p-4 ${selected ? 'border-hive-amber/60 bg-hive-amber/10' : 'border-hive-border bg-hive-elevated'}`}
                      >
                        <Pressable className="flex-1" onPress={() => void pickVoice(voice)}>
                          <Text className="text-base font-semibold text-hive-mist">{voice.name}</Text>
                          <Text className="mt-1 text-xs text-hive-steel">{voice.description}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void playPreview(voice.id)}
                          className="rounded-full border border-hive-border bg-hive-card p-2.5"
                          accessibilityLabel={`Preview ${voice.name}`}
                        >
                          {previewingId === voice.id ? (
                            <ActivityIndicator size="small" color={theme.colors.amber} />
                          ) : (
                            <Volume2 color={theme.colors.amber} size={18} />
                          )}
                        </Pressable>
                        {selected ? <Check color={theme.colors.amber} size={20} /> : null}
                      </View>
                    );
                  })
                : (
                  <Pressable
                    onPress={() => void playPreview('')}
                    className="flex-row items-center justify-center gap-2 rounded-sm border border-hive-border bg-hive-elevated p-4"
                  >
                    {previewingId === 'cartesia' ? (
                      <ActivityIndicator color={theme.colors.amber} />
                    ) : (
                      <Volume2 color={theme.colors.amber} size={18} />
                    )}
                    <Text className="text-sm font-semibold text-hive-mist">Preview Cartesia voice</Text>
                  </Pressable>
                )}
            </View>
          )}
        </>
      )}

      <View className="mt-8">
        <BigButton
          label={saving ? 'Saving…' : 'Done'}
          onPress={() => {
            void stopDiagnoseSpeech();
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}
