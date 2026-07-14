import { Camera, Mic, Route, Sparkles, Wrench } from 'lucide-react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { ProsBrandLogo } from '@/components/ProsBrandLogo';
import { PackBadge } from '@/components/PackBadge';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { getGuidedFlows } from '@/lib/knowledge/guided';
import { packIconComponent } from '@/lib/packs/icons';
import { loadRecents, type RecentDiagnosis } from '@/lib/recents';

const HERO_IMAGE = require('../../assets/images/hero-field-team.png');

const TIPS = [
  'Write clean filter PSI on the tank with a paint pen.',
  'LINE/LOAD swap is the #1 dead GFCI callback.',
  'A dirty salt cell lies — clean before you condemn.',
  'Open neutrals swing L1-N / L2-N under load. Treat as urgent.',
  'Brushing is not optional on green pools.',
  'Photo the model/serial before ordering appliance parts.',
  'Always clear the dryer vent when you replace a thermal fuse.',
  'Disposal jam: hex key first — fingers never.',
];

/**
 * Home uses StyleSheet colors (not only Tailwind classes) so the first paint
 * stays readable even if NativeWind CSS fails to load through a port forward.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activePack, setActivePackId, packs } = usePack();
  const [recents, setRecents] = useState<RecentDiagnosis[]>([]);
  const tip = TIPS[new Date().getDate() % TIPS.length];
  const flows = getGuidedFlows(activePack.id);

  useFocusEffect(
    useCallback(() => {
      void loadRecents().then(setRecents);
    }, [])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 36 + insets.bottom }}
    >
      <View style={styles.heroWrap}>
        <ImageBackground source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover">
          <View style={styles.heroOverlayTop} />
          <View style={styles.heroOverlayBottom} />
          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <ProsBrandLogo variant="hero-brand" />
            </View>
            <Text style={styles.tagline}>
              Snap it. Say it. Fix it. Field intelligence that fits in a glove.
            </Text>
            <View style={styles.packWrap}>
              <PackBadge pack={activePack} />
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.tipBlock}>
        <View style={styles.tipRow}>
          <Sparkles color={theme.colors.amber} size={16} />
          <Text style={styles.tipLabel}>Field tip</Text>
        </View>
        <Text style={styles.tipBody}>{tip}</Text>
      </View>

      <View style={styles.actions}>
        <BigButton
          label="Voice Chat"
          subtitle="Talk the fault — hands stay free"
          icon={<Mic color={theme.colors.onPrimary} size={26} strokeWidth={2.5} />}
          onPress={() =>
            router.push({ pathname: '/(tabs)/diagnose', params: { voice: '1' } })
          }
        />
        <BigButton
          label="Camera Diagnosis"
          subtitle="Photo the gear — get the playbook"
          variant="secondary"
          icon={<Camera color={theme.colors.brand} size={26} strokeWidth={2.5} />}
          onPress={() => router.push({ pathname: '/diagnose-session', params: { camera: '1' } })}
        />
        <BigButton
          label="Field Tools"
          subtitle="Codes, chemistry, wire charts, safety"
          variant="ghost"
          icon={<Wrench color={theme.colors.teal} size={26} strokeWidth={2.5} />}
          onPress={() => router.push('/tools')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Guided diagnose</Text>
        <View>
          {flows.map((flow, index) => (
            <Pressable
              key={flow.id}
              onPress={() => router.push(`/guided/${flow.id}`)}
              style={[styles.listRow, index > 0 ? styles.listRowBorder : null]}
            >
              <Route color={activePack.accentColor} size={22} />
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{flow.title}</Text>
                <Text style={styles.cardSub}>{flow.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Trade Packs</Text>
        <View>
          {packs.map((pack, index) => {
            const active = pack.id === activePack.id;
            const Icon = packIconComponent(pack);
            return (
              <Pressable
                key={pack.id}
                onPress={() => {
                  setActivePackId(pack.id);
                  router.push(`/pack/${pack.id}` as Href);
                }}
                style={[
                  styles.listRow,
                  index > 0 ? styles.listRowBorder : null,
                  active ? styles.listRowActive : null,
                ]}
              >
                <View style={[styles.packIcon, { backgroundColor: `${pack.accentColor}18` }]}>
                  <Icon color={pack.accentColor} size={24} strokeWidth={2.4} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>{pack.name}</Text>
                  <Text style={styles.cardSub}>{pack.tagline}</Text>
                </View>
                {active ? <Text style={styles.activeTag}>Active</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {recents.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent diagnoses</Text>
          <View>
            {recents.slice(0, 4).map((r, index) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/diagnose', params: { prompt: r.title } })
                }
                style={[styles.listRow, index > 0 ? styles.listRowBorder : null]}
              >
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {r.preview}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const R = theme.radius;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  heroWrap: {
    backgroundColor: theme.colors.elevated,
  },
  heroImage: {
    width: '100%',
    minHeight: 280,
    justifyContent: 'flex-end',
  },
  heroOverlayTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30, 58, 138, 0.12)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(250, 251, 252, 0.94)',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  brandRow: {
    alignItems: 'flex-start',
  },
  tagline: {
    marginTop: 10,
    maxWidth: 320,
    color: theme.colors.steel,
    fontSize: 16,
    lineHeight: 24,
  },
  packWrap: {
    marginTop: 14,
  },
  tipBlock: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.teal,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipLabel: {
    color: theme.colors.brand,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tipBody: {
    marginTop: 4,
    color: theme.colors.mist,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 10,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  listRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  listRowActive: {
    backgroundColor: `${theme.colors.amber}12`,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: R.sm,
  },
  packIcon: {
    width: 44,
    height: 44,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.mist,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    marginTop: 2,
    color: theme.colors.steel,
    fontSize: 13,
    lineHeight: 18,
  },
  activeTag: {
    color: theme.colors.amber,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
