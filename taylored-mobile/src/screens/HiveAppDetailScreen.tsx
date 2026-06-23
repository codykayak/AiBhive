import React from 'react';
import { ScrollView, Text, StyleSheet, View, Linking, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2, Hammer, ExternalLink, BookOpen, Rocket } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { GlassCard, PrimaryButton, StatusPill } from '../components/ui';
import type { HiveAppRecord } from '../lib/hiveApps';
import { findUserApp } from '../userApps';
import { colors, spacing } from '../theme/colors';

type Params = { app: HiveAppRecord };

export default function HiveAppDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ HiveAppDetail: Params }, 'HiveAppDetail'>>();
  const app = route.params?.app;

  if (!app) {
    return (
      <ScreenLayout title="App" contentStyle={styles.content}>
        <Text style={styles.body}>App not found.</Text>
      </ScreenLayout>
    );
  }

  const openPr = () => {
    if (!app.prUrl) {
      Alert.alert('Build link', 'The build link will appear here when the cloud agent opens a pull request.');
      return;
    }
    void Linking.openURL(app.prUrl);
  };

  const statusTone =
    app.status === 'complete' ? 'success' : app.status === 'failed' ? 'danger' : 'amber';
  const statusLabel =
    app.status === 'complete' ? 'Ready' : app.status === 'failed' ? 'Needs attention' : 'Building';

  const deliverable = app.deliverable;
  const hostScreenEntry = app.target === 'host_screen' && app.slug ? findUserApp(app.slug) : null;

  const openDeliverable = () => {
    if (app.target === 'host_screen') {
      if (hostScreenEntry) {
        navigation.navigate('UserApp', { slug: app.slug, title: app.title, summary: app.summary });
      } else {
        Alert.alert(
          'Open in AiBhive',
          'Install the latest AiBhive update from Settings → Check for updates to use this build.'
        );
      }
      return;
    }
    if (deliverable?.url) {
      void Linking.openURL(deliverable.url);
      return;
    }
    if (deliverable?.deepLink) {
      void Linking.openURL(deliverable.deepLink);
    }
  };

  const openLabel =
    deliverable?.label ||
    (app.target === 'web_app'
      ? 'Open web app'
      : app.target === 'native_app'
        ? 'Install your APK'
        : 'Open in AiBhive');

  return (
    <ScreenLayout title={app.title} subtitle={app.summary} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <StatusPill label={statusLabel} tone={statusTone} />

        {app.status === 'building' && (
          <GlassCard style={styles.card} glow>
            <View style={styles.row}>
              <Hammer color={colors.amberLight} size={22} />
              <Text style={styles.cardTitle}>Building in the cloud</Text>
            </View>
            <Text style={styles.body}>
              Our agent is coding your feature. You will get a notification when it is Ready. Keep AiBhive open or
              check back in My Apps.
            </Text>
          </GlassCard>
        )}

        {app.status === 'complete' && (
          <GlassCard style={styles.card} glow>
            <View style={styles.row}>
              <CheckCircle2 color={colors.success} size={22} />
              <Text style={styles.cardTitle}>Build finished — open it</Text>
            </View>
            <Text style={styles.body}>
              {app.target === 'web_app'
                ? 'Your build is live on the web. Tap to open or share the link.'
                : app.target === 'native_app'
                  ? 'Your standalone APK is ready to download and install.'
                  : hostScreenEntry
                    ? 'Your screen is registered inside AiBhive. Tap to open it now.'
                    : 'Your screen is built. The next AiBhive update (auto-shipping now) will make it tappable.'}
            </Text>
            <PrimaryButton
              label={openLabel}
              icon={Rocket}
              onPress={openDeliverable}
              style={styles.btn}
            />
            {app.target !== 'web_app' && (
              <PrimaryButton
                label="Check for updates"
                variant="secondary"
                onPress={() => navigation.navigate('Main', { screen: 'Settings' })}
                style={styles.btn}
              />
            )}
          </GlassCard>
        )}

        {app.status === 'failed' && (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Build needs another try</Text>
            <Text style={styles.body}>
              Describe a smaller first version on the Build tab, or retry with clearer details.
            </Text>
            <PrimaryButton
              label="Go to Build"
              onPress={() => navigation.navigate('HiveBuild')}
              style={styles.btn}
            />
          </GlassCard>
        )}

        {app.prompt ? (
          <GlassCard style={styles.card}>
            <Text style={styles.fieldLabel}>What you asked for</Text>
            <Text style={styles.prompt}>{app.prompt}</Text>
          </GlassCard>
        ) : null}

        <GlassCard style={styles.card}>
          <Text style={styles.fieldLabel}>Want it standalone or on your website?</Text>
          <Text style={styles.body}>
            In-app modules ship fastest. Web apps and separate APKs are on the roadmap — see the User Guide.
          </Text>
          <PrimaryButton
            label="Read User Guide"
            variant="secondary"
            icon={BookOpen}
            onPress={() => navigation.navigate('UserGuide')}
            style={styles.btn}
          />
          {app.prUrl ? (
            <PrimaryButton label="View cloud build" icon={ExternalLink} onPress={openPr} style={styles.btn} />
          ) : (
            <Text style={styles.hint}>Cloud build link appears here when available.</Text>
          )}
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
  cardTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 16 },
  body: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
  steps: { marginTop: 10, gap: 8 },
  step: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  fieldLabel: { color: colors.textDim, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  prompt: { color: colors.text, fontSize: 14, lineHeight: 21 },
  btn: { marginTop: 12, alignSelf: 'flex-start' },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
});
