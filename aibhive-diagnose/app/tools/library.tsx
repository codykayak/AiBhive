import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { FaultCard } from '@/components/FaultCard';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import { searchFaults } from '@/lib/knowledge/search';
import { resolveSearchPackId } from '@/lib/packs/access';

export default function FaultLibraryScreen() {
  const { activePack } = usePack();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');

  const searchPackId = resolveSearchPackId(activePack.id, Boolean(user));
  const results = useMemo(() => searchFaults(query, searchPackId), [query, searchPackId]);

  return (
    <View className="flex-1 bg-hive-bg">
      <View className="border-b border-hive-border px-4 pb-3 pt-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            user ? 'Search all trade pack faults…' : `Search ${activePack.shortName} faults…`
          }
          placeholderTextColor={theme.colors.steel}
          className="min-h-[52px] rounded-sm border border-hive-border bg-hive-card px-4 text-base text-hive-mist"
        />
        <Text className="mt-2 text-xs text-hive-steel">
          {results.length} playbooks ·{' '}
          {user ? 'all trade packs (signed in)' : `active pack: ${activePack.name}`}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {results.map((fault) => (
          <FaultCard key={fault.id} fault={fault} />
        ))}
      </ScrollView>
    </View>
  );
}
