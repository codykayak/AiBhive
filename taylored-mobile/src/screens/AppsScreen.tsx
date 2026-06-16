import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bot, AppWindow, Briefcase, Wand2, Sparkles, FolderKanban } from 'lucide-react-native';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { colors, radii, spacing } from '../theme/colors';

const BUILT_IN_APPS = [
  {
    id: 'tracker',
    title: 'Job Tracker',
    desc: 'Every application saved with cover letter, resume, status, and company research.',
    icon: FolderKanban,
    route: 'JobTracker',
    tag: 'Core',
  },
  {
    id: 'resume',
    title: 'Auto-Bot Resume',
    desc: 'Tailor resume, cover letter, and cold email to any job.',
    icon: Bot,
    route: 'AutoBotResume',
    tag: 'Apply',
  },
  {
    id: 'jewles',
    title: 'Jewles Web Studio',
    desc: 'Open the AiBhive web experience inside the app.',
    icon: AppWindow,
    route: 'JewlesWebView',
    tag: 'Built-in',
  },
];

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);

  return (
    <ScreenLayout
      title="My Hive Apps"
      subtitle="Apps and modules you create live here. Resume bot was just the first example — describe anything on the Build tab."
      contentStyle={styles.content}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
      >
        <GlassCard style={styles.buildCard}>
          <View style={styles.buildHeader}>
            <Wand2 color={colors.amberLight} size={22} />
            <Text style={styles.buildTitle}>Create something new</Text>
          </View>
          <Text style={styles.buildText}>
            Non-tech friendly: type what you want in plain English on the Build tab. Approve the estimate. Wait for the ding.
          </Text>
          <PrimaryButton
            label="Go to Build"
            onPress={() => navigation.navigate('Build')}
            style={styles.buildBtn}
          />
        </GlassCard>

        <Text style={styles.sectionLabel}>Your apps & examples</Text>

        {BUILT_IN_APPS.map((app) => {
          const Icon = app.icon;
          return (
            <TouchableOpacity
              key={app.id}
              style={styles.appCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate(app.route)}
            >
              <View style={styles.iconContainer}>
                <Icon color={colors.amberLight} size={34} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.appTitle}>{app.title}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{app.tag}</Text>
                  </View>
                </View>
                <Text style={styles.appDesc}>{app.desc}</Text>
              </View>
              <Briefcase color={colors.amber} size={18} />
            </TouchableOpacity>
          );
        })}

        <GlassCard style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles color={colors.amberLight} size={16} />
            <Text style={styles.tipTitle}>Try asking the hive</Text>
          </View>
          <Text style={styles.tipText}>
            "Add expense tracker" · "Build a habit tracker" · "Create interview prep cards" · "Make a lead follow-up bot"
          </Text>
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
  },
  buildCard: {
    marginBottom: spacing.lg,
    borderColor: colors.amber,
    borderWidth: 1,
  },
  buildHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  buildTitle: {
    color: colors.amberLight,
    fontWeight: '800',
    fontSize: 17,
  },
  buildText: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  buildBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  appTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  tag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  tagText: {
    color: colors.amberLight,
    fontSize: 10,
    fontWeight: '800',
  },
  appDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    marginTop: spacing.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipTitle: {
    color: colors.amberLight,
    fontWeight: '800',
  },
  tipText: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
