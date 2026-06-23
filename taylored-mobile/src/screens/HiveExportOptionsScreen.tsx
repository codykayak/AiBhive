import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Globe, Smartphone, Award, ChevronRight, Check, Sparkles } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { fetchUserApp, requestExport, type ExportTarget } from '../lib/hiveUserApps';
import { approveHiveTask, getOrCreateHiveUserId } from '../lib/hiveApi';
import { brandFor } from '../dynamicApps/branding';
import type { HiveAppSpec } from '../dynamicApps/types';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Params = { appId: string };

type OptionDef = {
  target: ExportTarget;
  icon: any;
  title: string;
  oneLiner: string;
  estimate: string;
  highlights: string[];
  whenToUse: string;
  whatYouDo: string[];
  whatYouGet: string[];
};

const OPTIONS: OptionDef[] = [
  {
    target: 'web_app',
    icon: Globe,
    title: 'Web link anyone can open',
    oneLiner: 'Your app lives at a personal URL.',
    estimate: '~$5 · ready in about 20 minutes',
    highlights: ['No install needed', 'Works on any phone or computer', 'Easy to share'],
    whenToUse:
      'Best when you want to send the app to friends, coworkers, or customers without asking them to install anything.',
    whatYouDo: [
      'Tap Choose this option.',
      'Approve the quote on the Build tab.',
      'Wait for the ding (we send a notification when it is live).',
      'Open My Apps and tap your app → Web link to copy or share it.',
    ],
    whatYouGet: [
      'A web address like aibhive.com/u/you/your-app/',
      'The same look and content you see in this app',
      'You can update it any time by tweaking the Hive app — your link stays the same',
    ],
  },
  {
    target: 'native_app',
    icon: Smartphone,
    title: 'Installable Android app (APK)',
    oneLiner: 'A standalone app on your phone, with its own icon and name.',
    estimate: '~$18 · ready in about 40 minutes',
    highlights: ['Your own app icon', 'Works offline', 'Install on your phone or share the file'],
    whenToUse:
      'Best when you want your app to feel like its own thing on your home screen — not inside AiBhive — but you are not ready for the Google Play Store yet.',
    whatYouDo: [
      'Tap Choose this option.',
      'Approve the quote on the Build tab.',
      'When ready, you will get a download link (.apk file).',
      'On your phone: tap the link → allow install from this source if asked → press Install.',
      'Open the app — it has your name, icon, and content built in.',
    ],
    whatYouGet: [
      'A real Android app file (.apk) you can install',
      'A QR code link you can scan from another phone',
      'A separate icon on your home screen with your branding',
      'No Google Play Store needed for testing',
    ],
  },
  {
    target: 'play_store',
    icon: Award,
    title: 'Make it Play Store ready',
    oneLiner: 'We prepare everything you need to publish on Google Play.',
    estimate: '~$35 · ready in about an hour',
    highlights: ['Signed app bundle (AAB)', 'Icon set + screenshots', 'Listing copy + step-by-step Play Console walkthrough'],
    whenToUse:
      'Best when you have used your app for a while, you love it, and you want it on the Google Play Store under your own developer account.',
    whatYouDo: [
      'Tap Choose this option.',
      'Approve the quote on the Build tab.',
      'When ready, open the PLAY_STORE_STEPS.md we make for you — it has numbered steps.',
      'Sign up at play.google.com/console (one-time $25 to Google).',
      'Upload the .aab file we send and paste the listing copy we wrote.',
      'Submit for internal testing first. Once it looks good, push to production.',
    ],
    whatYouGet: [
      'A signed AAB ready to upload to Google',
      'App icon in every size Google requires (48 → 512 px)',
      'Screenshots of your app for the listing',
      'A short description, full description, and category we suggest',
      'A printable checklist of every Play Console step',
    ],
  },
];

export default function HiveExportOptionsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ Export: Params }, 'Export'>>();
  const { appId } = route.params || ({} as Params);

  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<ExportTarget | null>(null);

  useEffect(() => {
    if (!appId) {
      setLoading(false);
      return;
    }
    fetchUserApp(appId)
      .then(setApp)
      .finally(() => setLoading(false));
  }, [appId]);

  const onChoose = (target: ExportTarget, def: OptionDef) => {
    Alert.alert(
      def.title,
      `${def.estimate}\n\n${def.whenToUse}\n\nAfter you approve the quote we start work. We will send a notification when your build is ready.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setBusy(target);
            try {
              const task = await requestExport(appId, target);
              if (!task) {
                Alert.alert(
                  'Could not start',
                  'The Hive is busy or offline. Try again in a few minutes.'
                );
                return;
              }
              const userId = await getOrCreateHiveUserId();
              try {
                await approveHiveTask(task.taskId, userId);
              } catch {
                // 402 needs-payment OR auth — Build tab will surface the next step.
              }
              navigation.navigate('HiveBuild');
              Alert.alert(
                'Build started',
                `We are working on your ${def.title.toLowerCase()}. You will get a notification when it is ready (~${def.estimate.split('·')[1]?.trim() || 'a few minutes'}). You can track progress on the Build tab.`
              );
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Could not start build.';
              Alert.alert('Build error', msg);
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenLayout title="Export" contentStyle={styles.content}>
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.amberLight} />
        </View>
      </ScreenLayout>
    );
  }

  if (!app) {
    return (
      <ScreenLayout title="Export" contentStyle={styles.content}>
        <Text style={styles.error}>Could not load this app.</Text>
      </ScreenLayout>
    );
  }

  const brand = brandFor(app.theme);

  return (
    <ScreenLayout title={`Export "${app.title}"`} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassCard style={[styles.introCard, { borderColor: brand.primary }]}>
          <View style={styles.introRow}>
            <Sparkles color={brand.primaryText} size={20} />
            <Text style={[styles.introTitle, { color: brand.primaryText }]}>How to take your app live</Text>
          </View>
          <Text style={styles.introBody}>
            Right now, your app works inside AiBhive — no Play Store update needed. When you are
            ready to share it more widely, pick one of the three options below. We do the work; you
            follow a short, plain-English checklist.
          </Text>
          <Text style={styles.introBody}>
            You only pay if you choose to publish. Tinkering in this app is free.
          </Text>
        </GlassCard>

        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <GlassCard key={opt.target} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBubble, { backgroundColor: brand.primarySoft }]}>
                  <Icon color={brand.primaryText} size={20} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{opt.title}</Text>
                  <Text style={styles.cardOne}>{opt.oneLiner}</Text>
                </View>
              </View>

              <View style={[styles.estimate, { borderColor: brand.primarySoft }]}>
                <Text style={[styles.estimateText, { color: brand.primaryText }]}>{opt.estimate}</Text>
              </View>

              <Text style={styles.sectionLabel}>Best for</Text>
              <Text style={styles.body}>{opt.whenToUse}</Text>

              <Text style={styles.sectionLabel}>You get</Text>
              {opt.whatYouGet.map((g, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Check color={brand.primary} size={14} />
                  <Text style={styles.bulletText}>{g}</Text>
                </View>
              ))}

              <Text style={styles.sectionLabel}>What you do (very simple)</Text>
              {opt.whatYouDo.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={[styles.stepNum, { color: brand.primary }]}>{i + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              <PrimaryButton
                label={busy === opt.target ? 'Starting…' : 'Choose this option'}
                icon={ChevronRight}
                disabled={!!busy}
                onPress={() => onChoose(opt.target, opt)}
                style={styles.chooseBtn}
              />
            </GlassCard>
          );
        })}

        <GlassCard style={styles.helpCard}>
          <Text style={styles.helpTitle}>Not sure which to pick?</Text>
          <Text style={styles.helpBody}>
            Most people pick <Text style={styles.helpStrong}>Web link</Text> first — it is cheap,
            fast, and easy to share. If a friend wants the app on their phone home screen, pick{' '}
            <Text style={styles.helpStrong}>Installable APK</Text>. Choose{' '}
            <Text style={styles.helpStrong}>Play Store ready</Text> only when you are ready to
            publicly publish.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserGuide')}>
            <Text style={[styles.helpLink, { color: brand.primaryText }]}>Read the full guide →</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  scroll: { paddingBottom: 32 },
  loaderRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  error: { color: colors.danger, fontSize: 14 },
  introCard: { marginBottom: spacing.lg, padding: spacing.md, borderWidth: 1 },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  introTitle: { ...typography.h3, fontWeight: '800' },
  introBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 6 },
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: spacing.sm },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  cardOne: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  estimate: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
  },
  estimateText: { fontWeight: '800', fontSize: 12 },
  sectionLabel: {
    color: colors.amberLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bulletText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  stepNum: { fontWeight: '800', width: 18, fontSize: 14 },
  stepText: { flex: 1, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  chooseBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  helpCard: { marginTop: spacing.sm, padding: spacing.md },
  helpTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  helpBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  helpStrong: { color: colors.text, fontWeight: '800' },
  helpLink: { fontWeight: '800', fontSize: 13 },
});
