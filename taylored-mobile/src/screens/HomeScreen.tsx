import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Briefcase, Wand2, Radar, ChevronRight } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { HiveOrb } from '../components/HiveOrb';
import { HomeAssistantChat } from '../components/HomeAssistantChat';
import { GlassCard } from '../components/ui';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { preloadHomeAssistantKnowledge } from '../lib/homeAssistantKnowledge';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { listIntelCases } from '../osint/cases';
import { countBuildingApps } from '../lib/hiveApps';
import type { IntelCase } from '../osint/types';

type HubCard = {
  id: 'do' | 'build' | 'research';
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
  accent: string;
};

const CARDS: HubCard[] = [
  {
    id: 'do',
    title: 'Do',
    subtitle: 'Track jobs, apply faster, manage your work pipeline.',
    icon: Briefcase,
    accent: colors.info,
  },
  {
    id: 'build',
    title: 'Build',
    subtitle: 'Describe any tool — AiBhive creates apps for your workflow.',
    icon: Wand2,
    accent: colors.amber,
  },
  {
    id: 'research',
    title: 'Research',
    subtitle: 'AI-directed intel on companies, domains, and people.',
    icon: Radar,
    accent: colors.purple,
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const tabBarPadding = useTabBarPadding(24);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [pendingAsk, setPendingAsk] = useState<string | undefined>();
  const [recentIntel, setRecentIntel] = useState<IntelCase[]>([]);
  const [buildingCount, setBuildingCount] = useState(0);

  useEffect(() => {
    preloadHomeAssistantKnowledge();
  }, []);

  const refresh = useCallback(async () => {
    const [cases, building] = await Promise.all([listIntelCases(), countBuildingApps()]);
    setRecentIntel(cases.slice(0, 2));
    setBuildingCount(building);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDo = () => navigation.navigate('JobTracker');

  const onCard = (id: HubCard['id']) => {
    if (id === 'do') openDo();
    else if (id === 'build') {
      setAssistantExpanded(true);
      setPendingAsk('I want to build a custom tool');
    } else {
      setAssistantExpanded(true);
      setPendingAsk('I need to research a company or target');
    }
  };

  return (
    <ScreenLayout compactBadge contentStyle={styles.screenContent}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <HiveOrb size={64} active />
          <Text style={styles.tagline}>Do · Build · Research</Text>
          <Text style={styles.heroBody}>
            Ask Grok on the home bar — jobs, research, or build anything. Your toolkit grows with every app you create.
          </Text>
        </View>

        <HomeAssistantChat
          expanded={assistantExpanded}
          onExpandChange={setAssistantExpanded}
          initialQuery={pendingAsk}
          onInitialQueryConsumed={() => setPendingAsk(undefined)}
        />

        <View style={styles.cards}>
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <TouchableOpacity key={card.id} activeOpacity={0.88} onPress={() => onCard(card.id)}>
                <GlassCard style={styles.card} glow={card.id === 'build'}>
                  <View style={[styles.iconCircle, { backgroundColor: `${card.accent}22` }]}>
                    <Icon color={card.accent} size={28} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  </View>
                  <ChevronRight color={colors.textDim} size={22} />
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {(buildingCount > 0 || recentIntel.length > 0) && (
          <View style={styles.activity}>
            <Text style={styles.activityTitle}>Active</Text>
            {buildingCount > 0 && (
              <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate('Apps')}>
                <Wand2 color={colors.amber} size={16} />
                <Text style={styles.activityText}>
                  {buildingCount} app{buildingCount === 1 ? '' : 's'} building
                </Text>
                <ChevronRight color={colors.textDim} size={16} />
              </TouchableOpacity>
            )}
            {recentIntel.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.activityRow}
                onPress={() => navigation.navigate('IntelCase', { caseId: c.id })}
              >
                <Radar color={colors.purple} size={16} />
                <Text style={styles.activityText} numberOfLines={1}>
                  Research: {c.target.label}
                </Text>
                <ChevronRight color={colors.textDim} size={16} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.toolkitLink} onPress={() => navigation.navigate('Apps')}>
          <Text style={styles.toolkitText}>Open toolkit — jobs, apps & more</Text>
          <ChevronRight color={colors.amberLight} size={18} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.md },
  scroll: { paddingTop: spacing.xs },
  hero: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.sm },
  tagline: {
    ...typography.h1,
    color: colors.amberLight,
    marginTop: spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  cards: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 20, marginBottom: 4 },
  cardSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  activity: { marginTop: spacing.lg },
  activityTitle: {
    color: colors.textDim,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  activityText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  toolkitLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  toolkitText: { color: colors.amberLight, fontWeight: '700', fontSize: 14 },
});
