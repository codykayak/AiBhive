import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bot, AppWindow, FolderKanban, Wand2, Sparkles, Boxes, Hammer } from 'lucide-react-native';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout } from '../components/ScreenLayout';
import { HiveOrb } from '../components/HiveOrb';
import {
  AppLauncherCard,
  EmptyState,
  GlassCard,
  PrimaryButton,
  SectionLabel,
} from '../components/ui';
import { HIVE_COPY } from '../constants/hiveCopy';
import { listHiveApps, type HiveAppRecord } from '../lib/hiveApps';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const BUILT_IN_APPS = [
  {
    id: 'tracker',
    title: 'Job Tracker',
    desc: 'Pipeline for every application — materials, status, company research.',
    icon: FolderKanban,
    route: 'JobTracker',
    tag: 'Core',
    accent: 'amber' as const,
  },
  {
    id: 'resume',
    title: 'Auto-Bot Resume',
    desc: 'Tailored resume, cover letter, and cold email in one tap.',
    icon: Bot,
    route: 'AutoBotResume',
    tag: 'Apply',
    accent: 'info' as const,
  },
  {
    id: 'enterprise',
    title: 'AiBhive Enterprise',
    desc: 'AI agents for leads, ops, and workflows at scale.',
    icon: AppWindow,
    route: 'EnterpriseWebView',
    tag: 'Enterprise',
    accent: 'purple' as const,
  },
];

function hiveStatusLabel(status: HiveAppRecord['status']) {
  if (status === 'complete') return 'Ready';
  if (status === 'failed') return 'Needs attention';
  return 'Building';
}

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const [hiveApps, setHiveApps] = useState<HiveAppRecord[]>([]);

  const load = useCallback(async () => {
    setHiveApps(await listHiveApps());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const buildingCount = hiveApps.filter((a) => a.status === 'building').length;

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.content}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
      >
        <View style={styles.hero}>
          <HiveOrb size={52} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{HIVE_COPY.appsHeroTitle}</Text>
            <Text style={styles.heroBody}>{HIVE_COPY.appsHeroBody}</Text>
          </View>
        </View>

        <GlassCard style={styles.statsRow} glow>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{hiveApps.length}</Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, buildingCount > 0 && styles.statActive]}>{buildingCount}</Text>
            <Text style={styles.statLabel}>Building</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{hiveApps.filter((a) => a.status === 'complete').length}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.buildCard} glow>
          <View style={styles.buildHeader}>
            <Wand2 color={colors.amberLight} size={22} />
            <Text style={styles.buildTitle}>Create something new</Text>
          </View>
          <Text style={styles.buildText}>
            Plain English in → working app out. No code. Approve once. Wait for the ding.
          </Text>
          <PrimaryButton
            label="Go to Build"
            onPress={() => navigation.navigate('Build')}
            style={styles.buildBtn}
            icon={Sparkles}
          />
        </GlassCard>

        <SectionLabel>{HIVE_COPY.appsRecent}</SectionLabel>

        {hiveApps.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Your factory is warming up"
            body={HIVE_COPY.appsEmptyBuilds}
            action={
              <PrimaryButton
                label="Start building"
                variant="secondary"
                onPress={() => navigation.navigate('Build')}
                style={{ marginTop: 12 }}
              />
            }
          />
        ) : (
          hiveApps.map((app) => (
            <AppLauncherCard
              key={app.id}
              title={app.title}
              desc={app.summary}
              tag={hiveStatusLabel(app.status)}
              icon={app.status === 'building' ? Hammer : Sparkles}
              accent={app.status === 'complete' ? 'amber' : 'info'}
              onPress={() => navigation.navigate('Build')}
            />
          ))
        )}

        <SectionLabel>{HIVE_COPY.appsBuiltIn}</SectionLabel>

        {BUILT_IN_APPS.map((app) => (
          <AppLauncherCard
            key={app.id}
            title={app.title}
            desc={app.desc}
            tag={app.tag}
            icon={app.icon}
            accent={app.accent}
            onPress={() => navigation.navigate(app.route)}
          />
        ))}

        <GlassCard style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles color={colors.amberLight} size={16} />
            <Text style={styles.tipTitle}>Hive ideas</Text>
          </View>
          <Text style={styles.tipText}>
            {HIVE_COPY.quickPrompts.join(' · ')}
          </Text>
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  heroCopy: { flex: 1 },
  heroTitle: { ...typography.h1, color: colors.text, marginBottom: 4 },
  heroBody: { ...typography.bodySm, color: colors.textMuted, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { ...typography.h2, color: colors.amberLight },
  statActive: { color: colors.info },
  statLabel: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.borderMuted },
  buildCard: { marginBottom: spacing.lg, borderColor: colors.borderStrong },
  buildHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  buildTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 17 },
  buildText: { color: colors.textMuted, lineHeight: 21, fontSize: 14, marginBottom: spacing.md },
  buildBtn: { alignSelf: 'flex-start', paddingHorizontal: 24 },
  tipCard: { marginTop: spacing.sm, marginBottom: spacing.md },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { color: colors.amberLight, fontWeight: '800' },
  tipText: { color: colors.textMuted, lineHeight: 22, fontSize: 14, fontStyle: 'italic' },
});
