import { Clock, ChevronRight } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { getHowToGuides } from '@/lib/knowledge/property/howtos';

export default function HowTosScreen() {
  const { activePack } = usePack();
  const guides =
    activePack.id === 'property'
      ? getHowToGuides('property')
      : getHowToGuides(activePack.id).length
        ? getHowToGuides(activePack.id)
        : getHowToGuides('property');

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-2xl font-bold text-hive-mist">How-to guides</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Glove-ready maintenance steps with photos. Tuned for Property Maintenance — useful on every turn.
      </Text>

      <View className="mt-6 gap-4">
        {guides.map((guide) => (
          <Pressable
            key={guide.id}
            onPress={() => router.push(`/tools/howto/${guide.id}` as Href)}
            className="overflow-hidden rounded-sm border border-hive-border bg-hive-elevated active:opacity-85"
          >
            {guide.image ? (
              <Image source={guide.image} style={{ width: '100%', height: 140 }} resizeMode="cover" />
            ) : null}
            <View className="flex-row items-center gap-3 p-4">
              <View className="flex-1">
                <Text className="text-lg font-bold text-hive-mist">{guide.title}</Text>
                <Text className="mt-1 text-sm text-hive-steel" numberOfLines={2}>
                  {guide.summary}
                </Text>
                <View className="mt-2 flex-row items-center gap-1.5">
                  <Clock color={theme.colors.steel} size={14} />
                  <Text className="text-xs font-semibold text-hive-steel">~{guide.minutes} min</Text>
                </View>
              </View>
              <ChevronRight color={theme.colors.steel} size={20} />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
