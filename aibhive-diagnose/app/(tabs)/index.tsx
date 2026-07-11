import { Camera, Mic, Route, Sparkles, Wrench, Waves, Zap } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { AiBhiveLogo, DiagnoseOrb } from '@/components/motion';
import { PackBadge } from '@/components/PackBadge';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { getGuidedFlows } from '@/lib/knowledge/guided';
import { loadRecents, type RecentDiagnosis } from '@/lib/recents';

const TIPS = [
  'Write clean filter PSI on the tank with a paint pen.',
  'LINE/LOAD swap is the #1 dead GFCI callback.',
  'A dirty salt cell lies — clean before you condemn.',
  'Open neutrals swing L1-N / L2-N under load. Treat as urgent.',
  'Brushing is not optional on green pools.',
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
      <View style={styles.hero}>
        <View style={[styles.heroBlob, { backgroundColor: activePack.accentColor, opacity: 0.25 }]} />
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <View style={styles.brandRow}>
              <AiBhiveLogo size={52} />
              <View>
                <Text style={styles.brandEyebrow}>TradeForge</Text>
                <Text style={styles.brandTitle}>Diagnose</Text>
              </View>
            </View>
            <Text style={styles.tagline}>
              Snap it. Say it. Fix it. Field intelligence that fits in a glove.
            </Text>
            <View style={styles.packWrap}>
              <PackBadge pack={activePack} />
            </View>
          </View>
          <DiagnoseOrb size={96} />
        </View>
      </View>

      <View style={styles.tipCard}>
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
          icon={<Mic color={theme.colors.bg} size={26} strokeWidth={2.5} />}
          onPress={() => router.push('/(tabs)/diagnose')}
        />
        <BigButton
          label="Camera Diagnosis"
          subtitle="Photo the gear — get the playbook"
          variant="secondary"
          icon={<Camera color={theme.colors.amber} size={26} strokeWidth={2.5} />}
          onPress={() => router.push({ pathname: '/diagnose-session', params: { camera: '1' } })}
        />
        <BigButton
          label="Field Tools"
          subtitle="Codes, chemistry, wire charts, safety"
          variant="ghost"
          icon={<Wrench color={theme.colors.mist} size={26} strokeWidth={2.5} />}
          onPress={() => router.push('/tools')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Guided diagnose</Text>
        <View style={styles.gap}>
          {flows.map((flow) => (
            <Pressable
              key={flow.id}
              onPress={() => router.push(`/guided/${flow.id}`)}
              style={styles.listCard}
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
        <View style={styles.gap}>
          {packs.map((pack) => {
            const active = pack.id === activePack.id;
            const Icon = pack.icon === 'waves' ? Waves : Zap;
            return (
              <Pressable
                key={pack.id}
                onPress={() => {
                  setActivePackId(pack.id);
                  router.push('/(tabs)/packs');
                }}
                style={[styles.packCard, active ? styles.packCardActive : null]}
              >
                <View style={[styles.packIcon, { backgroundColor: `${pack.accentColor}33` }]}>
                  <Icon color={pack.accentColor} size={28} strokeWidth={2.4} />
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
          <View style={styles.gap}>
            {recents.slice(0, 4).map((r) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/diagnose', params: { prompt: r.title } })
                }
                style={styles.recentCard}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: theme.colors.elevated,
  },
  heroBlob: {
    position: 'absolute',
    right: -40,
    top: -32,
    width: 192,
    height: 192,
    borderRadius: 96,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandEyebrow: {
    color: theme.colors.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  brandTitle: {
    marginTop: 4,
    color: theme.colors.mist,
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    marginTop: 12,
    maxWidth: 280,
    color: theme.colors.steel,
    fontSize: 16,
    lineHeight: 24,
  },
  packWrap: {
    marginTop: 16,
  },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipLabel: {
    color: theme.colors.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tipBody: {
    marginTop: 4,
    color: theme.colors.mist,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    marginBottom: 12,
    color: theme.colors.steel,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gap: {
    gap: 12,
  },
  listCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  packCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  packCardActive: {
    borderColor: theme.colors.amber,
    backgroundColor: theme.colors.card,
  },
  packIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  activeTag: {
    color: theme.colors.amber,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
