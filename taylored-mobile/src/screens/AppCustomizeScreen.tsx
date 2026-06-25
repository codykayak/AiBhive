import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Sparkles, Wand2, Code2, ChevronRight, Check, Share2 } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import {
  fetchUserApp, requestTweak, requestCustomize, shareAppToToolkit,
} from '../lib/hiveUserApps';
import { approveHiveTask, getOrCreateHiveUserId } from '../lib/hiveApi';
import { brandFor } from '../dynamicApps/branding';
import type { HiveAppSpec } from '../dynamicApps/types';
import { HIVE_COPY } from '../constants/hiveCopy';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Params = { appId: string };

export default function AppCustomizeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ AppCustomize: Params }, 'AppCustomize'>>();
  const { appId } = route.params || ({} as Params);

  const [app, setApp] = useState<HiveAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [tweakText, setTweakText] = useState('');
  const [customText, setCustomText] = useState('');
  const [busy, setBusy] = useState<'tweak' | 'customize' | 'share' | null>(null);

  useEffect(() => {
    if (!appId) {
      setLoading(false);
      return;
    }
    fetchUserApp(appId)
      .then(setApp)
      .finally(() => setLoading(false));
  }, [appId]);

  const onTweak = async () => {
    const msg = tweakText.trim();
    if (!msg) {
      Alert.alert('Describe your tweak', 'Example: "Add a notes page" or "Change theme to blue."');
      return;
    }
    setBusy('tweak');
    try {
      const result = await requestTweak(appId, msg);
      if (!result) {
        Alert.alert('Could not tweak', 'The Hive is busy or offline. Try again in a moment.');
        return;
      }
      setApp(result.app);
      setTweakText('');
      Alert.alert('Updated!', `"${result.app.title}" is ready with your changes.`, [
        {
          text: 'Open app',
          onPress: () => navigation.replace('DynamicApp', { appId: result.app.id, app: result.app }),
        },
        { text: 'Stay here', style: 'cancel' },
      ]);
    } finally {
      setBusy(null);
    }
  };

  const onCustomize = () => {
    const msg = customText.trim();
    if (!msg) {
      Alert.alert(
        'Describe the upgrade',
        'Example: "Make it look like my brand with a logo header" or "Add swipe gestures and custom charts."'
      );
      return;
    }
    Alert.alert(
      'Full customize',
      'This sends your app to the Hive cloud build team for real code — custom branding, layouts, and behavior. About $4+ · ~18 min.\n\nApprove the quote on the Build tab after we start.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setBusy('customize');
            try {
              const task = await requestCustomize(appId, msg);
              if (!task) {
                Alert.alert('Could not start', 'Try again when you are online.');
                return;
              }
              const userId = await getOrCreateHiveUserId();
              try {
                await approveHiveTask(task.taskId, userId);
              } catch {
                // Build tab handles payment / approval.
              }
              navigation.navigate('HiveBuild');
              Alert.alert(
                'Build started',
                'Hive is customizing your app. You will get a notification when it is ready.'
              );
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  const onShare = async () => {
    setBusy('share');
    try {
      const updated = await shareAppToToolkit(appId);
      if (updated) {
        setApp(updated);
        Alert.alert('Shared!', HIVE_COPY.toolkitShared);
      } else {
        Alert.alert('Could not share', 'Try again when you are online.');
      }
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <ScreenLayout title="Tweak or Customize" contentStyle={styles.content}>
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.amberLight} />
        </View>
      </ScreenLayout>
    );
  }

  if (!app) {
    return (
      <ScreenLayout title="Tweak or Customize" contentStyle={styles.content}>
        <Text style={styles.error}>Could not load this app.</Text>
      </ScreenLayout>
    );
  }

  const brand = brandFor(app.theme);
  const canShare = app.visibility !== 'community' && !app.sourceCommunityAppId;

  return (
    <ScreenLayout title={`"${app.title}"`} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassCard style={[styles.introCard, { borderColor: brand.primary }]}>
          <View style={styles.introRow}>
            <Sparkles color={brand.primaryText} size={20} />
            <Text style={[styles.introTitle, { color: brand.primaryText }]}>Tweak or Customize</Text>
          </View>
          <Text style={styles.introBody}>
            Start with a free community install or your own build. Then choose how far you want to go —
            quick spec edits stay instant; full customize unlocks real code.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: brand.primarySoft }]}>
              <Wand2 color={brand.primaryText} size={20} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Quick Tweak</Text>
              <Text style={styles.cardOne}>Same app, small changes — pages, theme, copy.</Text>
            </View>
          </View>

          <View style={[styles.estimate, { borderColor: brand.primarySoft }]}>
            <Text style={[styles.estimateText, { color: brand.primaryText }]}>~$0.50 · ready in seconds</Text>
          </View>

          {['Add a notes page', 'Change theme to purple', 'Rename the tracker unit'].map((hint) => (
            <View key={hint} style={styles.bulletRow}>
              <Check color={brand.primary} size={14} />
              <Text style={styles.bulletText}>{hint}</Text>
            </View>
          ))}

          <TextInput
            value={tweakText}
            onChangeText={setTweakText}
            placeholder='What should change? e.g. "Add a grocery list page"'
            placeholderTextColor={colors.textDim}
            multiline
            style={[styles.input, { borderColor: brand.primarySoft }]}
          />

          <PrimaryButton
            label={busy === 'tweak' ? 'Applying…' : 'Apply quick tweak'}
            icon={ChevronRight}
            disabled={!!busy}
            onPress={() => void onTweak()}
            style={styles.actionBtn}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: brand.primarySoft }]}>
              <Code2 color={brand.primaryText} size={20} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Full Hive Customize</Text>
              <Text style={styles.cardOne}>Real code — your branding, custom UX, advanced behavior.</Text>
            </View>
          </View>

          <View style={[styles.estimate, { borderColor: brand.primarySoft }]}>
            <Text style={[styles.estimateText, { color: brand.primaryText }]}>~$4+ · ~18 minutes</Text>
          </View>

          {[
            'Custom logo header and brand colors',
            'Gestures, charts, or flows spec pages cannot do',
            'Ship as a polished in-app feature',
          ].map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Check color={brand.primary} size={14} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}

          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder='Describe the upgrade — branding, layout, special behavior…'
            placeholderTextColor={colors.textDim}
            multiline
            style={[styles.input, { borderColor: brand.primarySoft }]}
          />

          <PrimaryButton
            label={busy === 'customize' ? 'Starting…' : 'Start full customize'}
            icon={ChevronRight}
            disabled={!!busy}
            onPress={onCustomize}
            style={styles.actionBtn}
          />
        </GlassCard>

        {canShare ? (
          <GlassCard style={styles.shareCard}>
            <Text style={styles.shareTitle}>Happy with it? Share to the hive.</Text>
            <Text style={styles.shareBody}>
              Apps only join the Community Toolkit when you opt in — we never share half-built drafts.
            </Text>
            <TouchableOpacity
              onPress={() => void onShare()}
              disabled={!!busy}
              style={styles.shareBtn}
            >
              <Share2 color={brand.primary} size={16} />
              <Text style={[styles.shareBtnText, { color: brand.primary }]}>
                {busy === 'share' ? 'Sharing…' : HIVE_COPY.shareToToolkit}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : app.visibility === 'community' ? (
          <Text style={styles.sharedBadge}>{HIVE_COPY.toolkitShared}</Text>
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.navigate('DynamicApp', { appId: app.id, app })}
          style={styles.backLink}
        >
          <Text style={[styles.backLinkText, { color: brand.primaryText }]}>← Back to app</Text>
        </TouchableOpacity>
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
  introBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
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
    marginBottom: spacing.sm,
  },
  estimateText: { fontWeight: '800', fontSize: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bulletText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  input: {
    marginTop: spacing.sm,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: colors.bg,
  },
  actionBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  shareCard: { marginBottom: spacing.md, padding: spacing.md },
  shareTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 15, marginBottom: 6 },
  shareBody: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.sm },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtnText: { fontSize: 13, fontWeight: '800' },
  sharedBadge: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  backLink: { alignSelf: 'center', marginTop: spacing.sm },
  backLinkText: { fontWeight: '800', fontSize: 14 },
});
