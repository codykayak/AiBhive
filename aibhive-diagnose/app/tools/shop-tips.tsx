import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { usePack } from '@/contexts/PackContext';
import {
  getCachedTips,
  refreshRemoteTips,
  type RemoteTip,
} from '@/lib/knowledge/remotePackCache';

export default function ShopTipsScreen() {
  const { getIdToken, user } = useAuth();
  const { activePack } = usePack();
  const { isOnline, isInternetReachable } = useNetwork();
  const offline = !isOnline || isInternetReachable === false;
  const [tips, setTips] = useState<RemoteTip[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const cached = await getCachedTips(activePack.id);
      setTips(cached);
      if (!offline && user) {
        const token = await getIdToken();
        if (token) {
          const fresh = await refreshRemoteTips(token, activePack.id, query || 'tip');
          setTips(fresh.length ? fresh : cached);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tips');
    } finally {
      setBusy(false);
    }
  }, [activePack.id, getIdToken, offline, query, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = tips.filter((t) => {
    if (!query.trim()) return true;
    return t.text.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-hive-mist">Shop tips</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Cached company + network tips for {activePack.shortName}. Works offline once synced.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Filter tips…"
        placeholderTextColor={theme.colors.steel}
        className="mt-4 min-h-[48px] rounded-xl border border-hive-border bg-hive-elevated px-3 text-base text-hive-mist"
      />

      <Pressable
        onPress={() => void load()}
        className="mt-3 self-start rounded-full border border-hive-border bg-hive-card px-4 py-2 active:opacity-70"
      >
        <Text className="text-sm font-semibold text-hive-amber">
          {busy ? 'Refreshing…' : offline ? 'Reload cache' : 'Refresh from Pros'}
        </Text>
      </Pressable>

      {error ? <Text className="mt-3 text-sm text-hive-danger">{error}</Text> : null}
      {!user ? (
        <Text className="mt-4 text-sm text-hive-steel">
          Sign in and join a Pros team to sync live shop tips. Cached tips still show when available.
        </Text>
      ) : null}

      {busy && !filtered.length ? (
        <ActivityIndicator color={theme.colors.amber} style={{ marginTop: 24 }} />
      ) : null}

      <View className="mt-6 gap-3">
        {filtered.map((tip) => (
          <View
            key={tip.id}
            className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-3"
          >
            <Text className="text-sm leading-5 text-hive-mist">{tip.text}</Text>
            <Text className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-hive-steel">
              {tip.scope === 'global' ? 'Network' : 'Shop'}
              {typeof tip.confirmedCount === 'number' && tip.confirmedCount > 0
                ? ` · ${tip.confirmedCount} confirmed`
                : ''}
            </Text>
          </View>
        ))}
        {!busy && !filtered.length ? (
          <Text className="text-sm text-hive-steel">No tips yet — diagnose and leave feedback to grow the playbook.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
