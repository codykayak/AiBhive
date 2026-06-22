import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Hammer, ExternalLink, BookOpen } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton } from '../components/ui';
import { colors, spacing } from '../theme/colors';

type Params = {
  slug?: string;
  title?: string;
  summary?: string;
  prUrl?: string;
  status?: 'building' | 'complete' | 'failed';
  deliverable?: { kind: string; url?: string; deepLink?: string; label?: string } | null;
};

/**
 * Shown when an in-app Hive build is referenced before the new screen has
 * shipped via OTA / APK update. Once the agent registers the real screen in
 * `userApps/index.ts`, the navigator routes there instead.
 */
export default function HiveAppPlaceholderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ Placeholder: Params }, 'Placeholder'>>();
  const params = (route.params || {}) as Params;
  const title = params.title || 'Your Hive build';

  const openUrl = (url?: string) => {
    if (!url) return;
    void Linking.openURL(url);
  };

  return (
    <ScreenLayout title={title} subtitle={params.summary} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.card} glow>
          <View style={styles.row}>
            <Hammer color={colors.amberLight} size={22} />
            <Text style={styles.cardTitle}>This build ships with the next AiBhive update</Text>
          </View>
          <Text style={styles.body}>
            The Hive auto-merges your build the moment it finishes coding, then publishes a fresh
            APK and an OTA update. If you do not see it yet:
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Tap Settings → Check for updates.</Text>
            <Text style={styles.step}>2. Install the latest AiBhive (v1.4.0 or newer).</Text>
            <Text style={styles.step}>3. Come back here — your new screen will be live.</Text>
          </View>
          <PrimaryButton
            label="Check for updates"
            onPress={() => navigation.navigate('Main', { screen: 'Settings' })}
            style={styles.btn}
          />
        </GlassCard>

        {params.deliverable?.url ? (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Or open the web version</Text>
            <Text style={styles.body}>Your build also has a shareable web link.</Text>
            <PrimaryButton
              label={params.deliverable.label || 'Open web app'}
              icon={ExternalLink}
              variant="secondary"
              onPress={() => openUrl(params.deliverable?.url)}
              style={styles.btn}
            />
          </GlassCard>
        ) : null}

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>How the build loop works</Text>
          <PrimaryButton
            label="Read User Guide"
            icon={BookOpen}
            variant="secondary"
            onPress={() => navigation.navigate('UserGuide')}
            style={styles.btn}
          />
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  scroll: { paddingBottom: 32 },
  card: { marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  body: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
  steps: { marginTop: 10, gap: 8 },
  step: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  btn: { marginTop: 12, alignSelf: 'flex-start' },
});
