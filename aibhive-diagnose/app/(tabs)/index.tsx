import { Camera, Mic, Waves, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/BigButton';
import { PackBadge } from '@/components/PackBadge';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activePack, setActivePackId, packs } = usePack();

  return (
    <ScrollView
      className="flex-1 bg-hive-bg"
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
    >
      <View className="relative overflow-hidden px-5 pb-8 pt-4">
        <View className="absolute inset-0 bg-hive-elevated" />
        <View
          className="absolute -right-16 -top-10 h-56 w-56 rounded-full opacity-30"
          style={{ backgroundColor: activePack.accentColor }}
        />
        <View
          className="absolute -left-10 bottom-0 h-40 w-40 rounded-full opacity-20"
          style={{ backgroundColor: theme.colors.amber }}
        />

        <Text className="font-mono text-xs font-bold uppercase tracking-[3px] text-hive-amber">
          TradeForge
        </Text>
        <Text className="mt-2 text-4xl font-bold leading-tight text-hive-mist">AiBhive Diagnose</Text>
        <Text className="mt-3 max-w-[320px] text-base leading-6 text-hive-steel">
          Voice-first AI co-pilot for techs in the field. Snap it. Say it. Fix it.
        </Text>

        <View className="mt-5">
          <PackBadge pack={activePack} />
        </View>
      </View>

      <View className="gap-3 px-5 pt-2">
        <BigButton
          label="Voice Chat"
          subtitle="Talk through the fault hands-free"
          icon={<Mic color={theme.colors.bg} size={26} strokeWidth={2.5} />}
          onPress={() => router.push({ pathname: '/diagnose', params: { voice: '1' } })}
        />
        <BigButton
          label="Camera Diagnosis"
          subtitle="Photo the equipment — get step-by-step"
          variant="secondary"
          icon={<Camera color={theme.colors.amber} size={26} strokeWidth={2.5} />}
          onPress={() =>
            router.push({ pathname: '/diagnose-session', params: { camera: '1' } })
          }
        />
      </View>

      <View className="mt-8 px-5">
        <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-hive-steel">
          Trade Packs
        </Text>
        <View className="gap-3">
          {packs.map((pack) => {
            const active = pack.id === activePack.id;
            const Icon = pack.icon === 'waves' ? Waves : Zap;
            return (
              <Pressable
                key={pack.id}
                onPress={() => {
                  setActivePackId(pack.id);
                  router.push('/packs');
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
                {active ? (
                  <Text className="text-xs font-bold uppercase text-hive-amber">Active</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
