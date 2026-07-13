import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';
import { searchCodes } from '@/lib/knowledge/search';

export default function CodesScreen() {
  const { activePack } = usePack();
  const [query, setQuery] = useState('');
  const codes = useMemo(() => searchCodes(query, activePack.id), [query, activePack.id]);

  return (
    <View className="flex-1 bg-hive-bg">
      <View className="border-b border-hive-border px-4 pb-3 pt-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Code, brand, or meaning…"
          placeholderTextColor={theme.colors.steel}
          className="min-h-[52px] rounded-sm border border-hive-border bg-hive-card px-4 text-base text-hive-mist"
          autoCapitalize="characters"
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {codes.map((code) => (
          <View key={code.id} className="rounded-sm border border-hive-border bg-hive-elevated px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-xl font-bold text-hive-amber">{code.code}</Text>
              <Text className="text-xs font-bold uppercase text-hive-steel">{code.severity}</Text>
            </View>
            {code.brand ? <Text className="mt-1 text-sm text-hive-pool">{code.brand}</Text> : null}
            <Text className="mt-2 text-base text-hive-mist">{code.meaning}</Text>
            <View className="mt-3 gap-1">
              {code.fix.map((f) => (
                <Text key={f} className="text-sm text-hive-steel">
                  • {f}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
