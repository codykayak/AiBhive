import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard } from '../components/ui';
import { AI_PROVIDERS, type ProviderId } from '../constants/providers';
import {
  getFirecrawlApiKey,
  getProviderApiKey,
  loadAiPrefs,
  saveFirecrawlApiKey,
  saveProviderApiKey,
  setActiveProvider,
  setCustomModel,
  setProviderEnabled,
  setProviderModel,
  type AiPrefs,
} from '../lib/ai';
import { colors, radii, spacing } from '../theme/colors';

export default function SettingsScreen() {
  const tabBarPadding = useTabBarPadding(24);
  const [prefs, setPrefs] = useState<AiPrefs | null>(null);
  const [keys, setKeys] = useState<Record<ProviderId, string>>({
    gemini: '',
    kimi: '',
    grok: '',
    claude: '',
    custom: '',
  });
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimers = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});

  const boot = useCallback(async () => {
    const loaded = await loadAiPrefs();
    setPrefs(loaded);
    const fc = (await getFirecrawlApiKey()) || '';
    setFirecrawlKey(fc);
    const keyMap = {} as Record<ProviderId, string>;
    for (const p of AI_PROVIDERS) {
      keyMap[p.id] = (await getProviderApiKey(p.id)) || '';
    }
    setKeys(keyMap);
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  const flashSaved = (label: string) => {
    setSaveStatus(`${label} saved`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const persistKey = (id: ProviderId, value: string) => {
    setKeys((prev) => ({ ...prev, [id]: value }));
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        await saveProviderApiKey(id, value);
        flashSaved(AI_PROVIDERS.find((p) => p.id === id)?.label || 'Key');
      } catch {
        Alert.alert('Save failed', 'Could not store API key securely on this device.');
      }
    }, 400);
  };

  const persistFirecrawl = (value: string) => {
    setFirecrawlKey(value);
    if (saveTimers.current.firecrawl) clearTimeout(saveTimers.current.firecrawl);
    saveTimers.current.firecrawl = setTimeout(async () => {
      try {
        await saveFirecrawlApiKey(value);
        flashSaved('Firecrawl key');
      } catch {
        Alert.alert('Save failed', 'Could not store Firecrawl key.');
      }
    }, 400);
  };

  const onToggle = async (id: ProviderId, enabled: boolean) => {
    const next = await setProviderEnabled(id, enabled);
    setPrefs(next);
  };

  const onSetActive = async (id: ProviderId) => {
    const next = await setActiveProvider(id);
    setPrefs(next);
  };

  const onPickModel = async (id: ProviderId, model: string) => {
    const next = await setProviderModel(id, model);
    setPrefs(next);
    flashSaved('Model');
  };

  if (!prefs) {
    return (
      <ScreenLayout title="Settings" showBrand={false}>
        <ActivityIndicator color={colors.amberLight} style={{ marginTop: 40 }} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Toggle providers on/off, pick models, keys auto-save as you type."
      showBrand={false}
      contentStyle={styles.content}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarPadding }}>
        {!!saveStatus && <Text style={styles.saved}>{saveStatus}</Text>}

        <Text style={styles.sectionTitle}>AI providers</Text>
        {AI_PROVIDERS.map((def) => {
          const p = prefs.providers[def.id];
          const isActive = prefs.activeProviderId === def.id;
          return (
            <GlassCard
              key={def.id}
              style={isActive ? { ...styles.providerCard, ...styles.providerActive } : styles.providerCard}
            >
              <View style={styles.providerHeader}>
                <View style={styles.providerTitleRow}>
                  <Text style={styles.providerName}>{def.label}</Text>
                  {isActive && p.enabled && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={p.enabled}
                  onValueChange={(v) => onToggle(def.id, v)}
                  trackColor={{ false: colors.borderMuted, true: colors.amber }}
                  thumbColor={p.enabled ? colors.amberLight : colors.textDim}
                />
              </View>

              {p.enabled && (
                <>
                  <TouchableOpacity style={styles.useBtn} onPress={() => onSetActive(def.id)}>
                    <Text style={styles.useBtnText}>{isActive ? 'Using for chat & tools' : 'Set as active'}</Text>
                  </TouchableOpacity>

                  <Text style={styles.fieldLabel}>Model</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelRow}>
                    {def.models.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.modelChip, p.model === m.id && styles.modelChipOn]}
                        onPress={() => onPickModel(def.id, m.id)}
                      >
                        <Text style={[styles.modelChipText, p.model === m.id && styles.modelChipTextOn]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {def.id === 'custom' && (
                    <TextInput
                      style={styles.input}
                      placeholder="Custom model id (e.g. gpt-4o-mini)"
                      placeholderTextColor={colors.textDim}
                      value={p.customModel || p.model}
                      onChangeText={async (t) => {
                        const next = await setCustomModel(def.id, t);
                        setPrefs(next);
                      }}
                      autoCapitalize="none"
                    />
                  )}

                  <Text style={styles.fieldLabel}>API key</Text>
                  <Text style={styles.hint}>{def.keyHint}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`${def.label} API key`}
                    placeholderTextColor={colors.textDim}
                    value={keys[def.id]}
                    onChangeText={(t) => persistKey(def.id, t)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              )}
            </GlassCard>
          );
        })}

        <Text style={styles.sectionTitle}>Firecrawl</Text>
        <Text style={styles.hint}>Job URL scraping and company intel.</Text>
        <TextInput
          style={styles.input}
          placeholder="Firecrawl API key"
          placeholderTextColor={colors.textDim}
          value={firecrawlKey}
          onChangeText={persistFirecrawl}
          secureTextEntry
          autoCapitalize="none"
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  saved: {
    color: colors.amberLight,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  providerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  providerActive: {
    borderColor: colors.amber,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  providerName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  activePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  activePillText: {
    color: colors.amberLight,
    fontSize: 10,
    fontWeight: '800',
  },
  useBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  useBtnText: {
    color: colors.amberLight,
    fontWeight: '700',
    fontSize: 13,
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 4,
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
  modelRow: {
    marginBottom: spacing.xs,
  },
  modelChip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  modelChipOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  modelChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modelChipTextOn: {
    color: colors.black,
  },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 15,
    marginTop: 4,
  },
});
