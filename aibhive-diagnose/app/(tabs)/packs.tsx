import { BookOpen, Check, Route } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { getGuidedFlows } from '@/lib/knowledge/guided';
import { getHowToGuides } from '@/lib/knowledge/property/howtos';
import { ALL_FAULTS } from '@/lib/knowledge/search';
import { packIconComponent } from '@/lib/packs/icons';
import type { TradePackId } from '@/lib/packs';

export default function PacksScreen() {
  const { activePackId, setActivePackId, packs, activePack } = usePack();
  const flows = getGuidedFlows(activePack.id);
  const faultCount =
    activePack.id === 'property'
      ? ALL_FAULTS.filter((f) => f.packId === 'property').length
      : ALL_FAULTS.filter((f) => f.packId === activePack.id).length;
  const howtos = getHowToGuides(activePack.id);

  const selectPack = (id: TradePackId) => {
    setActivePackId(id);
  };

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-hive-mist">Trade Packs</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Pool, Electrical, and Property Maintenance. Property pulls appliance RAG plus cross-trade
        playbooks.
      </Text>

      <View className="mt-6 gap-4">
        {packs.map((pack) => {
          const active = pack.id === activePackId;
          const Icon = packIconComponent(pack);
          return (
            <Pressable
              key={pack.id}
              onPress={() => selectPack(pack.id)}
              className={`overflow-hidden rounded-2xl border active:opacity-85 ${active ? 'border-hive-amber bg-hive-card' : 'border-hive-border bg-hive-elevated'}`}
            >
              {pack.heroImage ? (
                <Image source={pack.heroImage} style={{ width: '100%', height: 120 }} resizeMode="cover" />
              ) : null}
              <View className="p-5">
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
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        selectPack(pack.id);
                        router.push(`/pack-category/${pack.id}/${category.id}` as Href);
                      }}
                      className="rounded-full border border-hive-border bg-hive-bg px-3 py-1.5"
                    >
                      <Text className="text-xs font-semibold text-hive-steel">{category.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-8 rounded-2xl border border-hive-border bg-hive-elevated p-4">
        <Text className="text-lg font-bold text-hive-mist">{activePack.shortName} intelligence</Text>
        <Text className="mt-1 text-sm text-hive-steel">
          {faultCount} fault playbooks
          {activePack.crossPackSearch ? ' · cross-searches Pool + Electrical' : ''}.
        </Text>
        <View className="mt-4 gap-3">
          <Pressable
            onPress={() => router.push('/tools/library')}
            className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-hive-border bg-hive-card px-4 active:opacity-80"
          >
            <BookOpen color={theme.colors.amber} size={22} />
            <Text className="flex-1 font-bold text-hive-mist">Fault library</Text>
          </Pressable>
          {howtos.length ? (
            <Pressable
              onPress={() => router.push('/tools/howtos' as Href)}
              className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-hive-border bg-hive-card px-4 active:opacity-80"
            >
              <BookOpen color={activePack.accentColor} size={22} />
              <Text className="flex-1 font-bold text-hive-mist">How-to guides ({howtos.length})</Text>
            </Pressable>
          ) : null}
          {flows.map((flow) => (
            <Pressable
              key={flow.id}
              onPress={() => router.push(`/guided/${flow.id}`)}
              className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-hive-border bg-hive-card px-4 active:opacity-80"
            >
              <Route color={activePack.accentColor} size={22} />
              <View className="flex-1">
                <Text className="font-bold text-hive-mist">{flow.title}</Text>
                <Text className="text-xs text-hive-steel">{flow.description}</Text>
              </View>
            </Pressable>
          ))}
          <BigButton label="Open Diagnose chat" onPress={() => router.push('/(tabs)/diagnose')} />
        </View>
      </View>
    </ScrollView>
  );
}
