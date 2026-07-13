import { BookOpen, Route } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { getGuidedFlows } from '@/lib/knowledge/guided';
import { getHowToGuides } from '@/lib/knowledge/property/howtos';
import { searchFaults } from '@/lib/knowledge/search';
import { getTradePack, isTradePackId, type TradePackId } from '@/lib/packs';
import { packIconComponent } from '@/lib/packs/icons';
import { usePack } from '@/contexts/PackContext';

export default function PackCategoryScreen() {
  const { packId: packIdParam, categoryId } = useLocalSearchParams<{
    packId: string;
    categoryId: string;
  }>();
  const { setActivePackId } = usePack();
  const packIdRaw = String(packIdParam || '');

  if (!isTradePackId(packIdRaw)) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-hive-mist">Unknown pack.</Text>
      </View>
    );
  }

  const packId = packIdRaw as TradePackId;
  const pack = getTradePack(packId);
  const category = pack.categories.find((c) => c.id === categoryId);
  const Icon = packIconComponent(pack);
  const categoryFaults = searchFaults('', pack.id).filter((f) => f.category === category?.id);
  const howtos = getHowToGuides(pack.id, category?.id);
  const flows = getGuidedFlows(pack.id);

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-hive-mist">Category not found.</Text>
      </View>
    );
  }

  const hero = category.heroImage || pack.heroImage;

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ paddingBottom: 48 }}>
      {hero ? (
        <Image source={hero} style={{ width: '100%', height: 200 }} resizeMode="cover" />
      ) : (
        <View className="h-40 items-center justify-center" style={{ backgroundColor: `${pack.accentColor}44` }}>
          <Icon color={pack.accentColor} size={48} strokeWidth={2.2} />
        </View>
      )}

      <View className="px-5 pt-5">
        <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: pack.accentColor }}>
          {pack.shortName} Pack
        </Text>
        <Text className="mt-1 text-3xl font-bold text-hive-mist">{category.label}</Text>
        <Text className="mt-2 text-base text-hive-steel">
          Field playbooks and how-tos for this category. Property Maintenance also pulls Pool and Electrical
          when the job crosses trades.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {category.examples.map((ex) => (
            <Pressable
              key={ex}
              onPress={() => {
                setActivePackId(pack.id);
                router.push({ pathname: '/(tabs)/diagnose', params: { prompt: ex } });
              }}
              className="rounded-full border border-hive-border bg-hive-elevated px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-hive-mist">{ex}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-6">
          <BigButton
            label={`Diagnose ${category.label.toLowerCase()}`}
            onPress={() => {
              setActivePackId(pack.id);
              router.push('/(tabs)/diagnose');
            }}
          />
        </View>

        {howtos.length ? (
          <View className="mt-8">
            <Text className="text-lg font-bold text-hive-mist">How-to guides</Text>
            <View className="mt-3 gap-3">
              {howtos.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/tools/howto/${g.id}` as Href)}
                  className="overflow-hidden rounded-sm border border-hive-border bg-hive-elevated active:opacity-85"
                >
                  {g.image ? (
                    <Image source={g.image} style={{ width: '100%', height: 100 }} resizeMode="cover" />
                  ) : null}
                  <View className="p-4">
                    <Text className="font-bold text-hive-mist">{g.title}</Text>
                    <Text className="mt-1 text-sm text-hive-steel">{g.summary}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-8">
          <Text className="text-lg font-bold text-hive-mist">Fault playbooks</Text>
          <View className="mt-3 gap-2">
            {categoryFaults.slice(0, 12).map((fault) => (
              <Pressable
                key={fault.id}
                onPress={() => router.push(`/fault/${fault.id}`)}
                className="min-h-[56px] flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-elevated px-4 active:opacity-80"
              >
                <BookOpen color={pack.accentColor} size={20} />
                <View className="flex-1">
                  <Text className="font-bold text-hive-mist">{fault.title}</Text>
                  <Text className="text-xs text-hive-steel">{fault.severity} · {fault.packId}</Text>
                </View>
              </Pressable>
            ))}
            {!categoryFaults.length ? (
              <Pressable
                onPress={() => router.push('/tools/library')}
                className="rounded-sm border border-hive-border bg-hive-elevated p-4"
              >
                <Text className="text-hive-steel">Browse the full fault library for this pack.</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {flows.length ? (
          <View className="mt-8">
            <Text className="text-lg font-bold text-hive-mist">Guided diagnose</Text>
            <View className="mt-3 gap-2">
              {flows.map((flow) => (
                <Pressable
                  key={flow.id}
                  onPress={() => router.push(`/guided/${flow.id}`)}
                  className="min-h-[56px] flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-elevated px-4 active:opacity-80"
                >
                  <Route color={theme.colors.amber} size={20} />
                  <View className="flex-1">
                    <Text className="font-bold text-hive-mist">{flow.title}</Text>
                    <Text className="text-xs text-hive-steel">{flow.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
