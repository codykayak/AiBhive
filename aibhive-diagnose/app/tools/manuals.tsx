import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { BookOpen, ExternalLink } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { searchManuals } from '@/lib/knowledge/manuals';

export default function ManualsScreen() {
  const { activePack } = usePack();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');

  const results = useMemo(() => searchManuals(query, activePack.id), [query, activePack.id]);

  const openManual = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      enableBarCollapsing: true,
    });
  };

  return (
    <View className="flex-1 bg-hive-bg">
      <View className="border-b border-hive-border px-4 pb-3 pt-3">
        <Text className="mb-2 text-sm text-hive-steel">
          Enter a model number from the nameplate — we match OEM install & service manuals.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. RU199, 011057, WM3900, 24ACC636"
          placeholderTextColor={theme.colors.steel}
          autoCapitalize="characters"
          autoCorrect={false}
          className="min-h-[52px] rounded-2xl border border-hive-border bg-hive-card px-4 font-mono text-base text-hive-mist"
        />
        <Text className="mt-2 text-xs text-hive-steel">
          {results.length} manuals · {activePack.shortName} pack prioritized
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        {!query.trim() ? (
          <View className="rounded-2xl border border-hive-border bg-hive-card p-4">
            <Text className="font-bold text-hive-mist">Tip from the field</Text>
            <Text className="mt-2 text-sm text-hive-steel">
              Photo the model/serial sticker before you climb a ladder. Search the first 4–8 characters —
              manuals open in your browser for full PDFs and wiring diagrams.
            </Text>
          </View>
        ) : null}

        {query.trim() && results.length === 0 ? (
          <Text className="text-center text-hive-steel">
            No indexed manual for that model yet. Try the brand prefix or check the fault library.
          </Text>
        ) : null}

        {results.map((manual) => (
          <Pressable
            key={manual.id}
            onPress={() => void openManual(manual.manualUrl)}
            className="overflow-hidden rounded-2xl border border-hive-border bg-hive-elevated active:opacity-85"
          >
            {manual.thumbnailUrl ? (
              <Image
                source={{ uri: manual.thumbnailUrl }}
                style={{ width: '100%', height: 140, backgroundColor: theme.colors.card }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="h-28 items-center justify-center"
                style={{ backgroundColor: `${activePack.accentColor}18` }}
              >
                <BookOpen color={activePack.accentColor} size={40} strokeWidth={2} />
              </View>
            )}
            <View className="gap-2 p-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-hive-steel">
                {manual.brand} · {manual.category}
              </Text>
              <Text className="text-lg font-bold text-hive-mist">{manual.title}</Text>
              <Text className="text-sm text-hive-steel">{manual.summary}</Text>
              <Text className="font-mono text-xs text-hive-amber">
                {manual.modelPrefixes.slice(0, 5).join(' · ')}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <ExternalLink color={theme.colors.amber} size={18} />
                <Text className="text-sm font-semibold text-hive-amber">Open OEM manual</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
