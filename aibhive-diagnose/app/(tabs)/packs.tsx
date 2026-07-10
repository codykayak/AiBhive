import { Check, Waves, Zap } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import type { TradePackId } from '@/lib/packs';

export default function PacksScreen() {
  const { activePackId, setActivePackId, packs, activePack } = usePack();

  const selectPack = (id: TradePackId) => {
    setActivePackId(id);
  };

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerClassName="px-5 pb-10 pt-4">
      <Text className="text-2xl font-bold text-hive-mist">Trade Packs</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Switch packs anytime. Each pack tunes diagnosis prompts, quick actions, and equipment knowledge.
      </Text>

      <View className="mt-6 gap-4">
        {packs.map((pack) => {
          const active = pack.id === activePackId;
          const Icon = pack.icon === 'waves' ? Waves : Zap;
          return (
            <Pressable
              key={pack.id}
              onPress={() => selectPack(pack.id)}
              className={`rounded-2xl border p-5 active:opacity-85 ${active ? 'border-hive-amber bg-hive-card' : 'border-hive-border bg-hive-elevated'}`}
            >
              <View className="flex-row items-start justify-between">
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${pack.accentColor}33` }}
                >
                  <Icon color={pack.accentColor} size={28} strokeWidth={2.4} />
                </View>
                {active ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-hive-amber/20 px-2.5 py-1">
                    <Check color={theme.colors.amber} size={14} strokeWidth={3} />
                    <Text className="text-xs font-bold text-hive-amber">ACTIVE</Text>
                  </View>
                ) : null}
              </View>

              <Text className="mt-4 text-xl font-bold text-hive-mist">{pack.name}</Text>
              <Text className="mt-1 text-sm text-hive-steel">{pack.tagline}</Text>
              <Text className="mt-3 text-base leading-6 text-hive-mist/90">{pack.description}</Text>

              <View className="mt-4 flex-row flex-wrap gap-2">
                {pack.categories.map((category) => (
                  <View
                    key={category.id}
                    className="rounded-full border border-hive-border bg-hive-bg px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-hive-steel">{category.label}</Text>
                  </View>
                ))}
              </View>

              <View className="mt-4 border-t border-hive-border pt-4">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-hive-steel">
                  Common equipment
                </Text>
                {pack.commonEquipment.map((item) => (
                  <Text key={item} className="mb-1 text-sm text-hive-mist">
                    • {item}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6">
        <BigButton
          label={`Start ${activePack.shortName} Diagnosis`}
          subtitle="Opens camera + chat with this pack"
          accentColor={activePack.accentColor}
          onPress={() => router.push({ pathname: '/diagnose-session', params: { camera: '1' } })}
        />
      </View>
    </ScrollView>
  );
}
