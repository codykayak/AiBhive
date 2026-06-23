import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { BookOpen } from 'lucide-react-native';
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
import { PlansPanel } from '../components/PlansPanel';
import { AI_PROVIDERS, type ProviderId } from '../constants/providers';
import {
  DEFAULT_PREFS,
  getFirecrawlApiKey,
  getProviderApiKey,
  getSerpApiKey,
  loadAiPrefs,
  saveFirecrawlApiKey,
  saveProviderApiKey,
  saveSerpApiKey,
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
import { GOOGLE_AUTH_ENABLED } from '../constants/features';
import { useAuth } from '../contexts/AuthContext';
import { fetchHiveAccount, openAddCredits } from '../lib/hiveAccount';
import { HIVE_COPY } from '../constants/hiveCopy';
import { APP_VERSION } from '../constants/version';
import {
  applyPendingOtaRestart,
  checkForAppUpdate,
  getOtaStatus,
  openUpdateDownload,
  type UpdateCheckResult,
} from '../lib/appUpdates';

const EMPTY_KEYS: Record<ProviderId, string> = {
  gemini: '',
  kimi: '',
  grok: '',
  claude: '',
  custom: '',
};

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [planId, setPlanId] = useState('free');
  const [usage, setUsage] = useState<import('../lib/hiveAccount').UsageBudget | null>(null);
  const [prefs, setPrefs] = useState<AiPrefs>(() => ({
    activeProviderId: DEFAULT_PREFS.activeProviderId,
    providers: { ...DEFAULT_PREFS.providers },
  }));
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const [keysLoading, setKeysLoading] = useState(true);
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [serpapiKey, setSerpapiKey] = useState('');
  const [behavior, setBehavior] = useState<AiBehaviorPrefs>(() => ({ ...DEFAULT_BEHAVIOR }));
  const [saveStatus, setSaveStatus] = useState('');
  const [updateStatus, setUpdateStatus] = useState<UpdateCheckResult | null>(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [otaPending, setOtaPending] = useState(false);
  const saveTimers = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});
  const instructionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshAccount = useCallback(async () => {
    const a = await fetchHiveAccount();
    if (a) {
      setCreditBalance(a.creditBalanceUsd);
      setPlanId(a.planId ?? a.usage?.planId ?? 'free');
      setUsage(a.usage ?? null);
    }
  }, []);

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
      const serp = (await getSerpApiKey()) || '';
      setSerpapiKey(serp);
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

    await refreshAccount();
  }, [refreshAccount]);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    void getOtaStatus().then((s) => setOtaPending(s.pendingRestart));
  }, []);

  const onCheckForUpdates = async () => {
    setUpdateChecking(true);
    try {
      const result = await checkForAppUpdate();
      setUpdateStatus(result);
      if (result.status === 'ota-pending') setOtaPending(true);
    } finally {
      setUpdateChecking(false);
    }
  };

  const onApplyOtaRestart = async () => {
    const applied = await applyPendingOtaRestart();
    if (!applied) {
      Alert.alert('Update', 'Close AiBhive completely and open it again to apply the update.');
    }
  };

  const onDownloadUpdate = async () => {
    if (updateStatus?.status !== 'native-available') return;
    try {
      await openUpdateDownload(updateStatus.downloadUrl);
    } catch (err) {
      Alert.alert('Download', err instanceof Error ? err.message : 'Could not open download link.');
    }
  };

  useEffect(() => {
    if (user) {
      void refreshAccount();
    } else {
      setCreditBalance(null);
      setUsage(null);
      setPlanId('free');
    }
  }, [user, refreshAccount]);

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

  const persistSerpapi = (value: string) => {
    setSerpapiKey(value);
    if (saveTimers.current.serpapi) clearTimeout(saveTimers.current.serpapi);
    saveTimers.current.serpapi = setTimeout(async () => {
      try {
        await saveSerpApiKey(value);
        flashSaved('SerpAPI key');
      } catch {
        Alert.alert('Save failed', 'Could not store SerpAPI key.');
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

        <Text style={styles.sectionTitle}>Plans & usage</Text>
        <PlansPanel usage={usage} currentPlanId={planId} onRefresh={() => void refreshAccount()} />

        <Text style={styles.sectionTitle}>Your account</Text>
        <GlassCard style={styles.providerCard}>
          {!GOOGLE_AUTH_ENABLED ? (
            <>
              <Text style={styles.providerName}>Local mode</Text>
              <Text style={styles.hint}>
                Jobs and settings stay on this device. Google sign-in and cloud sync arrive in the next update.
              </Text>
            </>
          ) : authLoading ? (
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
                Sign in with Google to sync jobs, usage, and plans across devices.
              </Text>
              <TouchableOpacity style={styles.googleBtn} onPress={() => void signInWithGoogle()}>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>User Guide</Text>
        <GlassCard style={styles.providerCard}>
          <Text style={styles.providerName}>How builds become apps</Text>
          <Text style={styles.hint}>
            What My Apps means, how to open finished builds, and options for web apps or standalone APKs on your domain.
          </Text>
          <TouchableOpacity
            style={[styles.useBtn, styles.guideBtn]}
            onPress={() => navigation.navigate('UserGuide')}
          >
            <BookOpen color={colors.amberLight} size={18} />
            <Text style={styles.useBtnText}>Open User Guide</Text>
          </TouchableOpacity>
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

        <Text style={styles.sectionTitle}>App updates</Text>
        <GlassCard style={styles.providerCard}>
          <Text style={styles.providerName}>Installed: v{APP_VERSION}</Text>
          <Text style={styles.hint}>{HIVE_COPY.updateSectionHint}</Text>
          {updateStatus && <Text style={styles.updateMessage}>{updateStatus.message}</Text>}
          {updateStatus?.status === 'native-available' && updateStatus.releaseNotes ? (
            <Text style={styles.hint}>{updateStatus.releaseNotes}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.useBtn}
            onPress={() => void onCheckForUpdates()}
            disabled={updateChecking}
          >
            {updateChecking ? (
              <ActivityIndicator color={colors.amberLight} size="small" />
            ) : (
              <Text style={styles.useBtnText}>{HIVE_COPY.updateCheck}</Text>
            )}
          </TouchableOpacity>
          {otaPending && (
            <TouchableOpacity style={styles.googleBtn} onPress={() => void onApplyOtaRestart()}>
              <Text style={styles.googleBtnText}>{HIVE_COPY.updateRestart}</Text>
            </TouchableOpacity>
          )}
          {updateStatus?.status === 'native-available' && (
            <TouchableOpacity style={styles.googleBtn} onPress={() => void onDownloadUpdate()}>
              <Text style={styles.googleBtnText}>
                {HIVE_COPY.updateInstall} (v{updateStatus.latestVersion})
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>Firecrawl</Text>
        <Text style={styles.hint}>Deep web scrape and search for Intel Agent research.</Text>
        <TextInput
          style={styles.input}
          placeholder="Firecrawl API key"
          placeholderTextColor={colors.textDim}
          value={firecrawlKey}
          onChangeText={persistFirecrawl}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>SerpAPI</Text>
        <Text style={styles.hint}>Optional Google/Bing search results without scraping Google directly.</Text>
        <TextInput
          style={styles.input}
          placeholder="SerpAPI key"
          placeholderTextColor={colors.textDim}
          value={serpapiKey}
          onChangeText={persistSerpapi}
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
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.border,
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
  updateMessage: {
    color: colors.amberLight,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 18,
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
