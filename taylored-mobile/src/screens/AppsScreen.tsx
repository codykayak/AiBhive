import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Bot, AppWindow, Wand2, Sparkles,
} from 'lucide-react-native';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout, ScreenScrollView } from '../components/ScreenLayout';
import { HiveLogo } from '../components/HiveLogo';
import {
  AppLauncherCard,
  EmptyState,
  GlassCard,
  PrimaryButton,
  SectionLabel,
} from '../components/ui';
import { HIVE_COPY } from '../constants/hiveCopy';
import { BUILT_IN_HIVE_APPS } from '../constants/builtInHiveApps';
import { isLegacyFlipCalculatorApp } from '../constants/enhancedHiveApps';
import { PLATFORM_WEB_APPS } from '../constants/platformWebApps';
import { fetchUserApps, fetchCommunityToolkit, installToolkitApp } from '../lib/hiveUserApps';
import { openHiveApp } from '../lib/hiveAppNavigation';
import type { HiveAppSpec, CommunityToolkitApp } from '../dynamicApps/types';
import { brandFor, iconFor } from '../dynamicApps/branding';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const MORE_TOOLS = [
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
      Alert.alert(
        'Added to My Apps',
        `"${installed.title}" is ready. Tweak it for free or customize from the app menu.`,
        [
          {
            text: 'Tweak or Customize',
            onPress: () => navigation.navigate('AppCustomize', { appId: installed.id }),
          },
          {
            text: 'Open app',
            onPress: () => openHiveApp(navigation, installed),
          },
        ]
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ScreenLayout showBrand contentStyle={styles.content}>
      <ScreenScrollView
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
            <Text style={styles.statNum}>{BUILT_IN_HIVE_APPS.length + userApps.length}</Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.buildCard} glow>
          <View style={styles.buildHeader}>
            <Wand2 color={colors.amberLight} size={22} />
            <Text style={styles.buildTitle}>Your first app: $1–$5</Text>
          </View>
          <Text style={styles.buildText}>
            Describe any tool on the Build tab — most apps appear here in under a minute. Install from
            the community free, tweak for ~$0.50, or full customize from ~$4.
          </Text>
          <PrimaryButton
            label="Go to Build"
            onPress={() => navigation.navigate('HiveBuild')}
            style={styles.buildBtn}
            icon={Sparkles}
          />
        </GlassCard>

        <SectionLabel>Your Hive apps</SectionLabel>

        {BUILT_IN_HIVE_APPS.map((app) => {
          const Icon = app.icon;
          return (
            <AppLauncherCard
              key={app.id}
              title={app.title}
              desc={`by ${app.creator} · ${app.tagline}`}
              tag="Community"
              icon={Icon}
              accent="amber"
              onPress={() => openHiveApp(navigation, app)}
              style={{ borderLeftWidth: 4, borderLeftColor: app.primary, backgroundColor: app.surface + '88' }}
            />
          );
        })}

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={colors.amberLight} />
          </View>
        ) : userApps.length === 0 ? null : (
          userApps
            .filter((app) => !isLegacyFlipCalculatorApp(app))
            .map((app) => {
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
                onPress={() => openHiveApp(navigation, app)}
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
              Be the first — build an app, use it until you love it, then tap Share to add it here.
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
                    ? openHiveApp(navigation, ownedApp)
                    : void onInstallToolkit(app)
                }
                style={{ borderLeftWidth: 4, borderLeftColor: brand.primary }}
              />
            );
          })
        )}

        <SectionLabel>Web apps</SectionLabel>
        <Text style={styles.toolkitIntro}>
          AiBhive web tools — open in-app without leaving the Hive.
        </Text>
        <View style={styles.webAppGrid}>
          {PLATFORM_WEB_APPS.map((app) => {
            const Icon = app.icon;
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.webAppTile}
                onPress={() =>
                  navigation.navigate('HiveAppWebView', {
                    title: app.title,
                    url: app.url,
                    themeKey: 'research',
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.webAppIconWrap}>
                  <Icon color={colors.amberLight} size={22} />
                </View>
                <Text style={styles.webAppTitle} numberOfLines={2}>
                  {app.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionLabel>More</SectionLabel>
        {MORE_TOOLS.map((app) => (
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
      </ScreenScrollView>
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
  webAppGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  webAppTile: {
    width: '47%',
    minHeight: 96,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.bgElevated,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  webAppIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAppTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  tipCard: { marginTop: spacing.sm, marginBottom: spacing.md },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { color: colors.amberLight, fontWeight: '800' },
  tipText: { color: colors.textMuted, lineHeight: 22, fontSize: 14, fontStyle: 'italic' },
});
