import { ChevronRight } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { packIconComponent } from '@/lib/packs/icons';

/** Pack directory — each trade opens its own detail page with categories below. */
export default function PacksScreen() {
  const { activePackId, packs, allPacksUnlocked } = usePack();

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-hive-mist">Trade Packs</Text>
      <Text className="mt-1 text-base text-hive-steel">
        {allPacksUnlocked
          ? 'All trade packs unlocked — switch anytime. Diagnose searches every library while you’re signed in.'
          : 'Choose your trade — sign in to unlock every pack library.'}
      </Text>

      <View className="mt-6">
        {packs.map((pack, index) => {
          const active = pack.id === activePackId;
          const Icon = packIconComponent(pack);
          return (
            <Pressable
              key={pack.id}
              onPress={() => router.push(`/pack/${pack.id}` as Href)}
              className={`min-h-[88px] flex-row items-center gap-4 py-4 active:opacity-85 ${index > 0 ? 'border-t border-hive-border' : ''}`}
            >
              {pack.heroImage ? (
                <Image
                  source={pack.heroImage}
                  style={{ width: 72, height: 72, borderRadius: theme.radius.sm }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="h-[72px] w-[72px] items-center justify-center rounded-sm"
                  style={{ backgroundColor: `${pack.accentColor}18` }}
                >
                  <Icon color={pack.accentColor} size={30} strokeWidth={2.4} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-lg font-bold text-hive-mist">{pack.name}</Text>
                <Text className="mt-0.5 text-sm text-hive-steel">{pack.tagline}</Text>
                {active ? (
                  <Text className="mt-1 text-xs font-bold uppercase text-hive-amber">Active pack</Text>
                ) : null}
              </View>
              <ChevronRight color={theme.colors.steel} size={22} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
