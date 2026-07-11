import { Clock, Wrench } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BigButton } from '@/components/BigButton';
import { theme } from '@/constants/theme';
import { getHowToById } from '@/lib/knowledge/property/howtos';

export default function HowToDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = getHowToById(String(id || ''));

  if (!guide) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg px-6">
        <Text className="text-lg text-hive-mist">Guide not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-bold text-hive-amber">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ paddingBottom: 48 }}>
      {guide.image ? (
        <Image source={guide.image} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      ) : null}
      <View className="px-5 pt-5">
        <Text className="text-2xl font-bold text-hive-mist">{guide.title}</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Clock color={theme.colors.steel} size={14} />
          <Text className="text-sm text-hive-steel">~{guide.minutes} minutes</Text>
        </View>
        <Text className="mt-3 text-base leading-6 text-hive-mist/90">{guide.summary}</Text>

        <Text className="mt-6 text-xs font-bold uppercase tracking-wider text-hive-steel">Tools</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {guide.tools.map((t) => (
            <View
              key={t}
              className="flex-row items-center gap-1.5 rounded-full border border-hive-border bg-hive-elevated px-3 py-1.5"
            >
              <Wrench color={theme.colors.amber} size={12} />
              <Text className="text-xs font-semibold text-hive-mist">{t}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-xs font-bold uppercase tracking-wider text-hive-steel">Steps</Text>
        <View className="mt-3 gap-3">
          {guide.steps.map((step, i) => (
            <View
              key={`${guide.id}-${i}`}
              className="flex-row gap-3 rounded-2xl border border-hive-border bg-hive-elevated p-4"
            >
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: `${theme.colors.amber}33` }}
              >
                <Text className="font-bold text-hive-amber">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-base leading-6 text-hive-mist">{step}</Text>
            </View>
          ))}
        </View>

        {guide.relatedFaultIds?.[0] ? (
          <View className="mt-6">
            <BigButton
              label="Open related fault playbook"
              onPress={() => router.push(`/fault/${guide.relatedFaultIds![0]}`)}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
