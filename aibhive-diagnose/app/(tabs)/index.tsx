import { Camera, Mic, Route, Sparkles, Wrench, Waves, Zap } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
      className="flex-1 bg-hive-bg"
      contentContainerStyle={{ paddingBottom: 36 + insets.bottom }}
    >
      <View className="relative overflow-hidden px-5 pb-6 pt-2">
        <View className="absolute inset-0 bg-hive-elevated" />
        <View
          className="absolute -right-10 -top-8 h-48 w-48 rounded-full opacity-25"
          style={{ backgroundColor: activePack.accentColor }}
        />
        <View className="absolute -left-16 bottom-0 h-36 w-36 rounded-full bg-hive-amber/20" />

        {/* Plain View (not Reanimated entering) so static web SSR is visible
            even when Cursor's preview never finishes hydrating JS. */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-3">
              <AiBhiveLogo size={52} />
              <View>
                <Text className="font-mono text-xs font-bold uppercase tracking-[3px] text-hive-amber">
                  TradeForge
                </Text>
                <Text className="mt-1 text-2xl font-bold text-hive-mist">Diagnose</Text>
              </View>
            </View>
            <Text className="mt-3 max-w-[280px] text-base leading-6 text-hive-steel">
              Snap it. Say it. Fix it. Field intelligence that fits in a glove.
            </Text>
            <View className="mt-4">
              <PackBadge pack={activePack} />
            </View>
          </View>
          <DiagnoseOrb size={96} />
        </View>
      </View>

      <View className="mx-5 rounded-2xl border border-hive-border bg-hive-card px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Sparkles color={theme.colors.amber} size={16} />
          <Text className="text-xs font-bold uppercase tracking-wider text-hive-amber">Field tip</Text>
        </View>
        <Text className="mt-1 text-sm leading-5 text-hive-mist">{tip}</Text>
      </View>

      <View className="mt-5 gap-3 px-5">
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

      <View className="mt-8 px-5">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">Guided diagnose</Text>
        <View className="gap-3">
          {flows.map((flow) => (
            <Pressable
              key={flow.id}
              onPress={() => router.push(`/guided/${flow.id}`)}
              className="min-h-[68px] flex-row items-center gap-3 rounded-2xl border border-hive-border bg-hive-elevated px-4 py-3 active:opacity-80"
            >
              <Route color={activePack.accentColor} size={22} />
              <View className="flex-1">
                <Text className="text-base font-bold text-hive-mist">{flow.title}</Text>
                <Text className="text-sm text-hive-steel">{flow.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-8 px-5">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">Trade Packs</Text>
        <View className="gap-3">
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
                className={`min-h-[72px] flex-row items-center gap-4 rounded-2xl border px-4 py-4 active:opacity-80 ${active ? 'border-hive-amber bg-hive-card' : 'border-hive-border bg-hive-elevated'}`}
              >
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${pack.accentColor}33` }}
                >
                  <Icon color={pack.accentColor} size={28} strokeWidth={2.4} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-hive-mist">{pack.name}</Text>
                  <Text className="mt-0.5 text-sm text-hive-steel">{pack.tagline}</Text>
                </View>
                {active ? <Text className="text-xs font-bold uppercase text-hive-amber">Active</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {recents.length ? (
        <View className="mt-8 px-5">
          <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">Recent diagnoses</Text>
          <View className="gap-2">
            {recents.slice(0, 4).map((r) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/diagnose', params: { prompt: r.title } })
                }
                className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-3 active:opacity-80"
              >
                <Text className="font-bold text-hive-mist">{r.title}</Text>
                <Text className="mt-0.5 text-xs text-hive-steel" numberOfLines={1}>
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
