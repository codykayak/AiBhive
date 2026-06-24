import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Briefcase, Wand2, Radar, ChevronRight, Download, Share2, Sparkles } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { HomeAssistantChat } from '../components/HomeAssistantChat';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { preloadHomeAssistantKnowledge } from '../lib/homeAssistantKnowledge';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { listIntelCases } from '../osint/cases';
import { countBuildingApps } from '../lib/hiveApps';
import type { IntelCase } from '../osint/types';

const COMMUNITY_STEPS = [
  { n: '1', title: 'Install free', body: 'Browse the community toolkit — grab any shared app instantly.' },
  { n: '2', title: 'Tweak it', body: 'Quick edits in seconds (~$0.50). Your data stays on your phone.' },
  { n: '3', title: 'Share back', body: 'Love it? Opt in to share — the hive grows smarter for everyone.' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [pendingAsk, setPendingAsk] = useState<string | undefined>();
  const [recentIntel, setRecentIntel] = useState<IntelCase[]>([]);
  const [buildingCount, setBuildingCount] = useState(0);

  useEffect(() => {
    preloadHomeAssistantKnowledge();
  }, []);

  const refresh = useCallback(async () => {
    const [cases, building] = await Promise.all([listIntelCases(), countBuildingApps()]);
    setRecentIntel(cases.slice(0, 2));
    setBuildingCount(building);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ScreenLayout compactBadge contentStyle={styles.screenContent}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* $1–$5 hero sell */}
        <TouchableOpacity
          style={styles.priceBlock}
          activeOpacity={0.92}
          onPress={() => navigation.navigate('HiveBuild')}
        >
          <Text style={styles.priceEyebrow}>Your first app</Text>
          <Text style={styles.priceHeadline}>$1 to $5</Text>
          <Text style={styles.priceSub}>
            Describe any tool in plain English — live on your phone in under a minute. No Play Store update needed.
          </Text>
          <View style={styles.priceCta}>
            <Sparkles color={colors.black} size={18} />
            <Text style={styles.priceCtaText}>Build now</Text>
            <ChevronRight color={colors.black} size={18} />
          </View>
        </TouchableOpacity>

        {/* Community 1-2-3 */}
        <View style={styles.sectionHead}>
          <Share2 color={colors.amberLight} size={18} />
          <Text style={styles.sectionTitle}>Community app pool</Text>
        </View>
        {COMMUNITY_STEPS.map((step) => (
          <TouchableOpacity
            key={step.n}
            style={styles.stepBlock}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Apps')}
          >
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>{step.n}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
            <ChevronRight color={colors.textDim} size={20} />
          </TouchableOpacity>
        ))}

        <HomeAssistantChat
          expanded={assistantExpanded}
          onExpandChange={setAssistantExpanded}
          initialQuery={pendingAsk}
          onInitialQueryConsumed={() => setPendingAsk(undefined)}
        />

        {/* Full-width action blocks */}
        <TouchableOpacity style={styles.actionBlock} onPress={() => navigation.navigate('JobTracker')}>
          <Briefcase color={colors.info} size={26} />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Do</Text>
            <Text style={styles.actionSub}>Jobs, applications, Auto-Bot Resume</Text>
          </View>
          <ChevronRight color={colors.textDim} size={22} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBlock}
          onPress={() => {
            setAssistantExpanded(true);
            setPendingAsk('I want to build a custom tool');
          }}
        >
          <Wand2 color={colors.amber} size={26} />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Build</Text>
            <Text style={styles.actionSub}>Hive Magic — apps from plain English</Text>
          </View>
          <ChevronRight color={colors.textDim} size={22} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBlock} onPress={() => navigation.navigate('IntelAgent')}>
          <Radar color={colors.purple} size={26} />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Research</Text>
            <Text style={styles.actionSub}>Intel on companies, domains, and people</Text>
          </View>
          <ChevronRight color={colors.textDim} size={22} />
        </TouchableOpacity>

        {(buildingCount > 0 || recentIntel.length > 0) && (
          <View style={styles.activity}>
            <Text style={styles.activityTitle}>Active</Text>
            {buildingCount > 0 && (
              <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate('Apps')}>
                <Wand2 color={colors.amber} size={16} />
                <Text style={styles.activityText}>
                  {buildingCount} app{buildingCount === 1 ? '' : 's'} building
                </Text>
                <ChevronRight color={colors.textDim} size={16} />
              </TouchableOpacity>
            )}
            {recentIntel.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.activityRow}
                onPress={() => navigation.navigate('IntelCase', { caseId: c.id })}
              >
                <Radar color={colors.purple} size={16} />
                <Text style={styles.activityText} numberOfLines={1}>
                  Research: {c.target.label}
                </Text>
                <ChevronRight color={colors.textDim} size={16} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.toolkitBlock} onPress={() => navigation.navigate('Apps')}>
          <Download color={colors.amberLight} size={20} />
          <Text style={styles.toolkitText}>Open toolkit & community store</Text>
          <ChevronRight color={colors.amberLight} size={18} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.md },
  scroll: { paddingTop: spacing.xs },
  priceBlock: {
    width: '100%',
    backgroundColor: colors.amber,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  priceEyebrow: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  priceHeadline: {
    color: colors.black,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -1,
  },
  priceSub: {
    color: colors.black,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    opacity: 0.85,
  },
  priceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  priceCtaText: { color: colors.black, fontWeight: '900', fontSize: 15 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.amberLight, fontWeight: '900', fontSize: 17 },
  stepBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stepNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: colors.amberLight, fontWeight: '900', fontSize: 16 },
  stepCopy: { flex: 1 },
  stepTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  stepBody: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  actionBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.text, fontWeight: '900', fontSize: 18 },
  actionSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  activity: { marginTop: spacing.md },
  activityTitle: {
    color: colors.textDim,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  activityText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  toolkitBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.amber + '44',
    backgroundColor: colors.amberSoft,
  },
  toolkitText: { color: colors.amberLight, fontWeight: '800', fontSize: 15 },
});
