import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Radar, Sparkles, ChevronRight, Clock, Shield } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { colors, radii, spacing } from '../theme/colors';
import { getActiveLlmConfig } from '../lib/ai';
import { loadUseHiveCloudIntel, saveUseHiveCloudIntel } from '../osint/preferences';
import { OSINT_TOOLS, defaultEnabledToolIds } from '../osint/tools/registry';
import { createIntelCase, estimateRunSeconds, listIntelCases, resolveDomainFromTarget } from '../osint/cases';
import type { IntelCase, IntelTargetType, OsintToolId } from '../osint/types';

const TARGET_TYPES: { id: IntelTargetType; label: string }[] = [
  { id: 'company', label: 'Company' },
  { id: 'domain', label: 'Domain' },
  { id: 'person', label: 'Person' },
];

export default function IntelAgentScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const [targetType, setTargetType] = useState<IntelTargetType>('company');
  const [targetLabel, setTargetLabel] = useState('');
  const [domainOverride, setDomainOverride] = useState('');
  const [userIntent, setUserIntent] = useState(
    'I want to know everything there is to know about this target — leadership, tech stack, public contacts, infrastructure, and reputation.'
  );
  const [enabledTools, setEnabledTools] = useState<OsintToolId[]>(() => defaultEnabledToolIds());
  const [recentCases, setRecentCases] = useState<IntelCase[]>([]);
  const [agentReady, setAgentReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [useHiveCloud, setUseHiveCloud] = useState(true);

  const refresh = useCallback(async () => {
    const [cases, llm, hiveCloud] = await Promise.all([
      listIntelCases(),
      getActiveLlmConfig(),
      loadUseHiveCloudIntel(),
    ]);
    setRecentCases(cases.slice(0, 5));
    setAgentReady(!!llm);
    setUseHiveCloud(hiveCloud);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleTool = (id: OsintToolId) => {
    setEnabledTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const resolvedDomain = resolveDomainFromTarget(targetLabel, domainOverride);

  const startAgent = async () => {
    if (!targetLabel.trim()) {
      Alert.alert('Target required', 'Enter a company name, domain, or person to research.');
      return;
    }
    if (!enabledTools.length) {
      Alert.alert('Select tools', 'Enable at least one research module.');
      return;
    }
    if (!agentReady) {
      Alert.alert(
        'AI agent required',
        'Add an AI provider API key in Settings. The agent plans and synthesizes your research — tools can still run, but the brief needs AI.'
      );
      return;
    }

    setStarting(true);
    try {
      const intelCase = await createIntelCase({
        target: {
          type: targetType,
          label: targetLabel.trim(),
          domain: resolvedDomain || undefined,
          userIntent: userIntent.trim() || undefined,
        },
        enabledTools,
      });
      navigation.navigate('IntelCase', { caseId: intelCase.id, autoRun: true });
    } finally {
      setStarting(false);
    }
  };

  const estSeconds = estimateRunSeconds(enabledTools);

  const onHiveCloudToggle = (value: boolean) => {
    setUseHiveCloud(value);
    void saveUseHiveCloudIntel(value);
  };

  return (
    <ScreenLayout
      title="Intel Agent"
      subtitle="Turn on your AI agent. It learns what you want to know, then directs AiBhive research modules to gather and synthesize intelligence."
      compactBadge
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <Sparkles color={colors.amberLight} size={28} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>AI-directed OSINT</Text>
              <Text style={styles.heroBody}>
                One tap activates your chosen AI agent. It plans the search, runs your selected tools, and delivers an
                exportable intelligence brief.
              </Text>
            </View>
          </View>
          {!agentReady && (
            <TouchableOpacity
              style={styles.warnBanner}
              onPress={() => navigation.navigate('Main', { screen: 'Settings' })}
            >
              <Shield color={colors.amber} size={16} />
              <Text style={styles.warnText}>Add an AI API key in Settings to activate the agent</Text>
            </TouchableOpacity>
          )}
          <View style={styles.cloudRow}>
            <Text style={styles.cloudLabel}>Use Hive Cloud for Firecrawl/SerpAPI</Text>
            <Switch
              value={useHiveCloud}
              onValueChange={onHiveCloudToggle}
              trackColor={{ false: colors.borderMuted, true: colors.amber }}
              thumbColor={useHiveCloud ? colors.amberLight : colors.textDim}
            />
          </View>
          <Text style={styles.cloudHint}>
            Uses AiBhive credits when you lack your own API keys. Never scrapes Google directly.
          </Text>
        </GlassCard>

        <GlassCard style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Authorized research only</Text>
          <Text style={styles.disclaimerBody}>
            AiBhive Intel gathers publicly available data for legitimate business, security, and journalistic
            research. Google dorks open in your browser — we never automate Google searches from the app.
          </Text>
        </GlassCard>

        <Text style={styles.sectionLabel}>Target</Text>
        <View style={styles.typeRow}>
          {TARGET_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, targetType === t.id && styles.typeChipOn]}
              onPress={() => setTargetType(t.id)}
            >
              <Text style={[styles.typeChipText, targetType === t.id && styles.typeChipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder={targetType === 'domain' ? 'example.com' : 'Acme Corporation'}
          placeholderTextColor={colors.textDim}
          value={targetLabel}
          onChangeText={setTargetLabel}
          autoCapitalize="none"
        />
        {targetType !== 'domain' && (
          <>
            <Text style={styles.hint}>Domain override (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder={resolvedDomain || 'acme.com'}
              placeholderTextColor={colors.textDim}
              value={domainOverride}
              onChangeText={setDomainOverride}
              autoCapitalize="none"
            />
          </>
        )}

        <Text style={styles.sectionLabel}>What do you want to know?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell the agent your research goals…"
          placeholderTextColor={colors.textDim}
          value={userIntent}
          onChangeText={setUserIntent}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.toolsHeader}>
          <Text style={styles.sectionLabel}>Research modules</Text>
          <Text style={styles.estBadge}>~{Math.ceil(estSeconds / 60)} min est.</Text>
        </View>
        {OSINT_TOOLS.map((tool) => {
          const on = enabledTools.includes(tool.id);
          return (
            <View key={tool.id} style={styles.toolRow}>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc}>{tool.description}</Text>
                {tool.tier === 'api_key' && (
                  <Text style={styles.apiBadge}>API key optional — Settings</Text>
                )}
              </View>
              <Switch
                value={on}
                onValueChange={() => toggleTool(tool.id)}
                trackColor={{ false: colors.borderMuted, true: colors.amber }}
                thumbColor={on ? colors.amberLight : colors.textDim}
              />
            </View>
          );
        })}

        <PrimaryButton
          label={starting ? 'Starting…' : 'Activate Intel Agent'}
          onPress={() => void startAgent()}
          loading={starting}
          disabled={starting}
          icon={Radar}
          style={styles.startBtn}
        />

        {recentCases.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Recent cases</Text>
            {recentCases.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.caseRow}
                onPress={() => navigation.navigate('IntelCase', { caseId: c.id })}
              >
                <View>
                  <Text style={styles.caseTitle}>{c.target.label}</Text>
                  <Text style={styles.caseMeta}>
                    {c.status} · {new Date(c.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  heroCard: { padding: spacing.md, marginBottom: spacing.md },
  heroRow: { flexDirection: 'row', gap: spacing.sm },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { color: colors.text, fontWeight: '900', fontSize: 17, marginBottom: 4 },
  heroBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    padding: 10,
    backgroundColor: colors.amberSoft,
    borderRadius: radii.sm,
  },
  warnText: { color: colors.amberLight, fontSize: 13, flex: 1, fontWeight: '600' },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  cloudLabel: { color: colors.text, fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 },
  cloudHint: { color: colors.textDim, fontSize: 11, marginTop: 6, lineHeight: 16 },
  disclaimerCard: { padding: spacing.md, marginBottom: spacing.md },
  disclaimerTitle: { color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  disclaimerBody: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  sectionLabel: {
    color: colors.amberLight,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  typeChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  typeChipTextOn: { color: colors.black },
  input: {
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  textArea: { minHeight: 88 },
  hint: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  toolsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estBadge: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: 12,
  },
  toolInfo: { flex: 1 },
  toolName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  toolDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  apiBadge: { color: colors.info, fontSize: 11, marginTop: 4, fontWeight: '600' },
  startBtn: { marginTop: spacing.lg },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  caseTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  caseMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
});
