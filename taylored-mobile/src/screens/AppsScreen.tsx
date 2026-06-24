import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Bot, AppWindow, FolderKanban, Wand2, Sparkles, Boxes,
} from 'lucide-react-native';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout } from '../components/ScreenLayout';
import { HiveLogo } from '../components/HiveLogo';
import {
  AppLauncherCard,
  EmptyState,
  GlassCard,
  PrimaryButton,
  SectionLabel,
} from '../components/ui';
import { HIVE_COPY } from '../constants/hiveCopy';
import { fetchUserApps, fetchCommunityToolkit, installToolkitApp } from '../lib/hiveUserApps';
import type { HiveAppSpec, CommunityToolkitApp } from '../dynamicApps/types';
import { brandFor, iconFor } from '../dynamicApps/branding';
import { colors, radii, spacing } from '../theme/colors';
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

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const [userApps, setUserApps] = useState<HiveAppSpec[]>([]);
  const [toolkitApps, setToolkitApps] = useState<CommunityToolkitApp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, toolkit] = await Promise.all([fetchUserApps(), fetchCommunityToolkit()]);
      setUserApps(apps);
      setToolkitApps(toolkit);
    } finally {
      setLoading(false);
    }
  }, []);

  const onInstallToolkit = async (app: CommunityToolkitApp) => {
    const installed = await installToolkitApp(app.id);
    if (installed) {
      await load();
      navigation.navigate('DynamicApp', { appId: installed.id, app: installed });
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ScreenLayout showBrand contentStyle={styles.content}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
      >
        <View style={styles.hero}>
          <HiveLogo size={56} glow animate />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{HIVE_COPY.appsHeroTitle}</Text>
            <Text style={styles.heroBody}>{HIVE_COPY.appsHeroBody}</Text>
          </View>
        </View>

        <GlassCard style={styles.statsRow} glow>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{userApps.length}</Text>
            <Text style={styles.statLabel}>Your apps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{userApps.reduce((n, a) => n + (a.pages?.length || 0), 0)}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLabel}>Starter tools</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.buildCard} glow>
          <View style={styles.buildHeader}>
            <Wand2 color={colors.amberLight} size={22} />
            <Text style={styles.buildTitle}>Make a new app — instantly</Text>
          </View>
          <Text style={styles.buildText}>
            Describe it on the Build tab. Most apps appear here in under a minute — no Play Store
            update needed. When you love it, tap Export to publish as a web app, an installable APK,
            or a real Play Store listing.
          </Text>
          <PrimaryButton
            label="Go to Build"
            onPress={() => navigation.navigate('HiveBuild')}
            style={styles.buildBtn}
            icon={Sparkles}
          />
        </GlassCard>

        <SectionLabel>Your Hive apps</SectionLabel>

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={colors.amberLight} />
          </View>
        ) : userApps.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Your factory is warming up"
            body='No apps yet. Try: "Build me a habit tracker" or "Make a tip calculator" on the Build tab.'
            action={
              <PrimaryButton
                label="Start building"
                variant="secondary"
                onPress={() => navigation.navigate('HiveBuild')}
                style={{ marginTop: 12 }}
              />
            }
          />
        ) : (
          userApps.map((app) => {
            const brand = brandFor(app.theme);
            const Icon = iconFor(app.icon);
            return (
              <AppLauncherCard
                key={app.id}
                title={app.title}
                desc={app.tagline || app.summary || `${app.pages?.length || 0} page(s)`}
                tag="Live"
                icon={Icon}
                accent="amber"
                onPress={() => navigation.navigate('DynamicApp', { appId: app.id, app })}
                style={{ borderLeftWidth: 4, borderLeftColor: brand.primary }}
              />
            );
          })
        )}

        <SectionLabel>{HIVE_COPY.toolkitTitle}</SectionLabel>
        <Text style={styles.toolkitIntro}>{HIVE_COPY.toolkitBody}</Text>
        {toolkitApps.length === 0 ? (
          <GlassCard style={styles.toolkitEmpty}>
            <Text style={styles.toolkitEmptyText}>
              Be the first — build an app on Home or Build and it joins the shared toolkit automatically.
            </Text>
          </GlassCard>
        ) : (
          toolkitApps.map((app) => {
            const brand = brandFor(app.theme);
            const Icon = iconFor(app.icon);
            const ownedApp = userApps.find((u) => u.sourceCommunityAppId === app.id);
            const owned = !!ownedApp;
            return (
              <AppLauncherCard
                key={`toolkit-${app.id}`}
                title={app.title}
                desc={app.tagline || app.summary || `${app.pages?.length || 0} page(s)`}
                tag={owned ? 'Installed' : `${app.installCount || 0} users`}
                icon={Icon}
                accent="purple"
                onPress={() =>
                  owned && ownedApp
                    ? navigation.navigate('DynamicApp', { appId: ownedApp.id, app: ownedApp })
                    : void onInstallToolkit(app)
                }
                style={{ borderLeftWidth: 4, borderLeftColor: brand.primary }}
              />
            );
          })
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
          <Text style={styles.tipText}>{HIVE_COPY.quickPrompts.join(' · ')}</Text>
          <PrimaryButton
            label="How it all works"
            variant="secondary"
            onPress={() => navigation.navigate('UserGuide')}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          />
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
  statLabel: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.borderMuted },
  buildCard: { marginBottom: spacing.lg, borderColor: colors.borderStrong, borderRadius: radii.lg },
  buildHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  buildTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 17 },
  buildText: { color: colors.textMuted, lineHeight: 21, fontSize: 14, marginBottom: spacing.md },
  buildBtn: { alignSelf: 'flex-start', paddingHorizontal: 24 },
  loaderRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  toolkitIntro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  toolkitEmpty: { marginBottom: spacing.md, padding: spacing.md },
  toolkitEmptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  tipCard: { marginTop: spacing.sm, marginBottom: spacing.md },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { color: colors.amberLight, fontWeight: '800' },
  tipText: { color: colors.textMuted, lineHeight: 22, fontSize: 14, fontStyle: 'italic' },
});
