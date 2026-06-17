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
  DEFAULT_PREFS,
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
import {
  loadAiBehavior,
  saveAiBehavior,
  setCustomInstructions,
  setMaxOutputTokens,
  setResponseStyle,
} from '../lib/aiBehavior';
import {
  DEFAULT_BEHAVIOR,
  MAX_TOKEN_OPTIONS,
  RESPONSE_STYLE_HINTS,
  type AiBehaviorPrefs,
  type ResponseStyle,
} from '../constants/hivePrompt';
import { colors, radii, spacing } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { fetchHiveAccount, openAddCredits } from '../lib/hiveAccount';
import { HIVE_COPY } from '../constants/hiveCopy';

const EMPTY_KEYS: Record<ProviderId, string> = {
  gemini: '',
  kimi: '',
  grok: '',
  claude: '',
  custom: '',
};

export default function SettingsScreen() {
  const tabBarPadding = useTabBarPadding(24);
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [prefs, setPrefs] = useState<AiPrefs>(() => ({
    activeProviderId: DEFAULT_PREFS.activeProviderId,
    providers: { ...DEFAULT_PREFS.providers },
  }));
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const [keysLoading, setKeysLoading] = useState(true);
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [behavior, setBehavior] = useState<AiBehaviorPrefs>(() => ({ ...DEFAULT_BEHAVIOR }));
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimers = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});
  const instructionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boot = useCallback(async () => {
    setKeysLoading(true);
    try {
      const loaded = await loadAiPrefs();
      setPrefs(loaded);
    } catch {
      setPrefs({
        activeProviderId: DEFAULT_PREFS.activeProviderId,
        providers: { ...DEFAULT_PREFS.providers },
      });
    }

    try {
      const loadedBehavior = await loadAiBehavior();
      setBehavior(loadedBehavior);
    } catch {
      setBehavior({ ...DEFAULT_BEHAVIOR });
    }

    try {
      const fc = (await getFirecrawlApiKey()) || '';
      setFirecrawlKey(fc);
      const keyMap = { ...EMPTY_KEYS };
      await Promise.all(
        AI_PROVIDERS.map(async (p) => {
          keyMap[p.id] = (await getProviderApiKey(p.id)) || '';
        })
      );
      setKeys(keyMap);
    } catch {
      // Keys unavailable — UI still usable for toggles/models
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (user) {
      fetchHiveAccount().then((a) => {
        if (a) setCreditBalance(a.creditBalanceUsd);
      });
    } else {
      setCreditBalance(null);
    }
  }, [user]);

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

  const onPickResponseStyle = async (style: ResponseStyle) => {
    const next = await setResponseStyle(style);
    setBehavior(next);
    flashSaved('Response style');
  };

  const onPickMaxTokens = async (tokens: number) => {
    const next = await setMaxOutputTokens(tokens);
    setBehavior(next);
    flashSaved('Max length');
  };

  const onCustomInstructionsChange = (text: string) => {
    setBehavior((prev) => ({ ...prev, customInstructions: text }));
    if (instructionsTimer.current) clearTimeout(instructionsTimer.current);
    instructionsTimer.current = setTimeout(async () => {
      await setCustomInstructions(text);
      flashSaved('AI instructions');
    }, 500);
  };

  const onResetBehavior = async () => {
    await saveAiBehavior({ ...DEFAULT_BEHAVIOR });
    setBehavior({ ...DEFAULT_BEHAVIOR });
    flashSaved('Defaults restored');
  };

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Toggle providers on/off, pick models, keys auto-save as you type."
      showBrand={false}
      contentStyle={styles.content}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarPadding }}>
        {!!saveStatus && <Text style={styles.saved}>{saveStatus}</Text>}

        <Text style={styles.sectionTitle}>Your account</Text>
        <GlassCard style={styles.providerCard}>
          {authLoading ? (
            <ActivityIndicator color={colors.amberLight} />
          ) : user ? (
            <>
              <Text style={styles.providerName}>{user.displayName || 'Signed in'}</Text>
              <Text style={styles.hint}>{user.email}</Text>
              {creditBalance !== null && (
                <Text style={styles.creditLine}>{HIVE_COPY.balanceLabel(creditBalance)}</Text>
              )}
              <TouchableOpacity style={styles.useBtn} onPress={() => void openAddCredits()}>
                <Text style={styles.useBtnText}>Add Hive credits</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutBtn} onPress={() => void signOut()}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.hint}>
                Sign in with Google to save your resume, jobs, and $5 welcome Hive credits across devices.
              </Text>
              <TouchableOpacity style={styles.googleBtn} onPress={() => void signInWithGoogle()}>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>AI providers</Text>
        {keysLoading && (
          <ActivityIndicator color={colors.amberLight} style={{ marginBottom: spacing.sm }} />
        )}
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

        <Text style={styles.sectionTitle}>AI behavior</Text>
        <GlassCard style={styles.providerCard}>
          <Text style={styles.fieldLabel}>Custom instructions</Text>
          <Text style={styles.hint}>
            Tell the AI how to behave — e.g. keep answers short, focus on building apps for the user, avoid technical jargon.
          </Text>
          <TextInput
            style={[styles.input, styles.instructionsInput]}
            placeholder="Example: Keep answers short and friendly. Help people build apps, don't use technical jargon."
            placeholderTextColor={colors.textDim}
            value={behavior.customInstructions}
            onChangeText={onCustomInstructionsChange}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Response length</Text>
          <View style={styles.chipRow}>
            {(['concise', 'balanced', 'detailed'] as ResponseStyle[]).map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.modelChip, behavior.responseStyle === style && styles.modelChipOn]}
                onPress={() => onPickResponseStyle(style)}
              >
                <Text
                  style={[styles.modelChipText, behavior.responseStyle === style && styles.modelChipTextOn]}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>{RESPONSE_STYLE_HINTS[behavior.responseStyle]}</Text>

          <Text style={styles.fieldLabel}>Max tokens</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelRow}>
            {MAX_TOKEN_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.modelChip, behavior.maxOutputTokens === n && styles.modelChipOn]}
                onPress={() => onPickMaxTokens(n)}
              >
                <Text
                  style={[styles.modelChipText, behavior.maxOutputTokens === n && styles.modelChipTextOn]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.hint}>Lower = shorter replies. 512 is good for quick chat.</Text>

          <TouchableOpacity style={styles.resetBtn} onPress={onResetBehavior}>
            <Text style={styles.resetBtnText}>Reset to defaults</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={styles.sectionTitle}>Firecrawl</Text>
        <Text style={styles.hint}>Job URL scraping and company research.</Text>
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
  instructionsInput: {
    minHeight: 96,
    maxHeight: 160,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.xs,
  },
  resetBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  resetBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  creditLine: {
    color: colors.amberLight,
    fontWeight: '800',
    marginTop: spacing.sm,
    fontSize: 14,
  },
  googleBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleBtnText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 15,
  },
  signOutBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  signOutText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
