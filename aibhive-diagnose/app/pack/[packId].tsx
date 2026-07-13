import { BookOpen, Check, ChevronRight, Route } from 'lucide-react-native';
import { useEffect, useLayoutEffect } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { getGuidedFlows } from '@/lib/knowledge/guided';
import { getHowToGuides } from '@/lib/knowledge/property/howtos';
import { ALL_FAULTS } from '@/lib/knowledge/search';
import { getTradePack, isTradePackId, type TradePackId } from '@/lib/packs';
import { packIconComponent } from '@/lib/packs/icons';

export default function PackDetailScreen() {
  const { packId: packIdParam } = useLocalSearchParams<{ packId: string }>();
  const { activePackId, setActivePackId } = usePack();
  const navigation = useNavigation();
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
  const Icon = packIconComponent(pack);
  const isActive = activePackId === pack.id;
  const flows = getGuidedFlows(pack.id);
  const howtos = getHowToGuides(pack.id);
  const faultCount = ALL_FAULTS.filter((f) => f.packId === pack.id).length;

  useEffect(() => {
    setActivePackId(pack.id);
  }, [pack.id, setActivePackId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: pack.shortName });
  }, [navigation, pack.shortName]);

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ paddingBottom: 48 }}>
      {pack.heroImage ? (
        <Image source={pack.heroImage} style={{ width: '100%', height: 200 }} resizeMode="cover" />
      ) : (
        <View className="h-44 items-center justify-center" style={{ backgroundColor: `${pack.accentColor}22` }}>
          <Icon color={pack.accentColor} size={52} strokeWidth={2.2} />
        </View>
      )}

      <View className="px-5 pt-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: pack.accentColor }}>
              Trade pack
            </Text>
            <Text className="mt-1 text-3xl font-bold text-hive-mist">{pack.name}</Text>
            <Text className="mt-1 text-base font-semibold text-hive-steel">{pack.tagline}</Text>
          </View>
          {isActive ? (
            <View className="flex-row items-center gap-1 rounded-sm border border-hive-amber/40 bg-hive-amber/15 px-2.5 py-1">
              <Check color={theme.colors.amber} size={14} strokeWidth={3} />
              <Text className="text-xs font-bold text-hive-amber">ACTIVE</Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-4 text-base leading-6 text-hive-mist">{pack.description}</Text>

        <View className="mt-6">
          <BigButton
            label="Open Diagnose chat"
            onPress={() => router.push('/(tabs)/diagnose')}
            accentColor={pack.accentColor}
          />
        </View>

        <Text className="mt-8 text-xs font-bold uppercase tracking-wider text-hive-brand">Categories</Text>
        <Text className="mt-1 text-sm text-hive-steel">
          Pick a category to browse playbooks, examples, and how-tos.
        </Text>

        <View className="mt-4">
          {pack.categories.map((category, index) => (
            <Pressable
              key={category.id}
              onPress={() => router.push(`/pack-category/${pack.id}/${category.id}` as Href)}
              className={`min-h-[72px] flex-row items-center gap-3 py-4 active:opacity-80 ${index > 0 ? 'border-t border-hive-border' : ''}`}
            >
              {category.heroImage ? (
                <Image
                  source={category.heroImage}
                  style={{ width: 56, height: 56, borderRadius: theme.radius.sm }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="h-14 w-14 items-center justify-center rounded-sm"
                  style={{ backgroundColor: `${pack.accentColor}18` }}
                >
                  <Icon color={pack.accentColor} size={24} strokeWidth={2.2} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-bold text-hive-mist">{category.label}</Text>
                <Text className="mt-0.5 text-sm text-hive-steel" numberOfLines={2}>
                  {category.examples.slice(0, 2).join(' · ')}
                </Text>
              </View>
              <ChevronRight color={theme.colors.steel} size={20} />
            </Pressable>
          ))}
        </View>

        <View className="mt-8 border-t border-hive-border pt-6">
          <Text className="text-lg font-bold text-hive-mist">{pack.shortName} intelligence</Text>
          <Text className="mt-1 text-sm text-hive-steel">
            {faultCount} fault playbooks
            {pack.crossPackSearch ? ' · cross-searches Pool + Electrical' : ''}.
          </Text>
          <View className="mt-4 gap-2">
            <Pressable
              onPress={() => router.push('/tools/library')}
              className="min-h-[56px] flex-row items-center gap-3 border-b border-hive-border py-3 active:opacity-80"
            >
              <BookOpen color={theme.colors.amber} size={22} />
              <Text className="flex-1 font-bold text-hive-mist">Fault library</Text>
              <ChevronRight color={theme.colors.steel} size={18} />
            </Pressable>
            {howtos.length ? (
              <Pressable
                onPress={() => router.push('/tools/howtos' as Href)}
                className="min-h-[56px] flex-row items-center gap-3 border-b border-hive-border py-3 active:opacity-80"
              >
                <BookOpen color={pack.accentColor} size={22} />
                <Text className="flex-1 font-bold text-hive-mist">How-to guides ({howtos.length})</Text>
                <ChevronRight color={theme.colors.steel} size={18} />
              </Pressable>
            ) : null}
            {flows.map((flow) => (
              <Pressable
                key={flow.id}
                onPress={() => router.push(`/guided/${flow.id}`)}
                className="min-h-[56px] flex-row items-center gap-3 border-b border-hive-border py-3 active:opacity-80"
              >
                <Route color={pack.accentColor} size={22} />
                <View className="flex-1">
                  <Text className="font-bold text-hive-mist">{flow.title}</Text>
                  <Text className="text-xs text-hive-steel">{flow.description}</Text>
                </View>
                <ChevronRight color={theme.colors.steel} size={18} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
