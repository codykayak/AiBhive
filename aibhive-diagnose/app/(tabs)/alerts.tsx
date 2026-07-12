import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Bell, CheckCircle2, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePack } from '@/contexts/PackContext';
import {
  fetchProsNotifications,
  respondProsNotification,
  type ProsNotification,
} from '@/lib/jobs/prosNotifications';

export default function AlertsScreen() {
  const { getIdToken, user } = useAuth();
  const { activePack } = usePack();
  const [items, setItems] = useState<ProsNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fixDraft, setFixDraft] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      setItems([]);
      return;
    }
    setRefreshing(true);
    try {
      setItems(await fetchProsNotifications(token));
    } finally {
      setRefreshing(false);
    }
  }, [getIdToken]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const pending = items.filter((n) => n.status === 'pending');

  const respond = async (n: ProsNotification, completed: boolean) => {
    const token = await getIdToken();
    if (!token) return;

    const fixSummary = fixDraft[n.id]?.trim() || '';
    if (completed && !fixSummary) {
      Alert.alert('Add a fix summary', 'Type what you did in the box below — it feeds your shop knowledge base.');
      return;
    }

    await submitResponse(token, n, completed, fixSummary);
  };

  const submitResponse = async (
    token: string,
    n: ProsNotification,
    completed: boolean,
    fixSummary: string
  ) => {
    const ok = await respondProsNotification(token, n.id, {
      completed,
      fixSummary,
      tipText: completed ? fixSummary : undefined,
      packId: activePack.id,
      jobTitle: n.jobTitle || undefined,
    });
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (n.jobId) router.push(`/job/${n.jobId}` as never);
      await refresh();
    } else {
      Alert.alert('Could not save', 'Check connection and try again.');
    }
  };

  if (!user) {
    return (
      <View className="flex-1 bg-hive-bg items-center justify-center px-8">
        <Bell color={theme.colors.steel} size={40} />
        <Text className="text-hive-mist font-bold text-lg mt-4 text-center">Dispatch alerts</Text>
        <Text className="text-hive-steel text-sm mt-2 text-center">
          Sign in with Pros to receive job updates from your manager.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-hive-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
    >
      <Text className="text-2xl font-bold text-hive-mist">Alerts</Text>
      <Text className="mt-1 text-base text-hive-steel">
        {pending.length
          ? `${pending.length} pending from dispatch`
          : 'Job updates from Pros HQ appear here.'}
      </Text>

      <View className="mt-6 gap-3">
        {items.length === 0 ? (
          <View className="rounded-2xl border border-hive-border bg-hive-elevated p-6 items-center">
            <Text className="text-hive-steel text-sm text-center">No alerts yet.</Text>
          </View>
        ) : (
          items.map((n) => (
            <View key={n.id} className="rounded-2xl border border-hive-border bg-hive-elevated p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Text
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    n.priority === 'urgent'
                      ? 'bg-red-500/20 text-red-300'
                      : n.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-white/10 text-hive-steel'
                  }`}
                >
                  {n.priority}
                </Text>
                <Text className="text-[10px] uppercase text-hive-steel">{n.status}</Text>
              </View>
              <Text className="text-lg font-bold text-hive-mist">{n.title}</Text>
              {n.body ? <Text className="text-sm text-hive-steel mt-1">{n.body}</Text> : null}
              {n.jobTitle ? (
                <Pressable
                  onPress={() => n.jobId && router.push(`/job/${n.jobId}` as never)}
                  className="mt-2"
                >
                  <Text className="text-xs text-hive-amber">Job: {n.jobTitle}</Text>
                </Pressable>
              ) : null}

              {n.response?.fixSummary ? (
                <Text className="text-sm text-emerald-400 mt-2 border-l-2 border-emerald-500/40 pl-2">
                  Fix: {n.response.fixSummary}
                </Text>
              ) : null}

              {n.status === 'pending' ? (
                <View className="mt-4 gap-2">
                  <TextInput
                    value={fixDraft[n.id] || ''}
                    onChangeText={(t) => setFixDraft((d) => ({ ...d, [n.id]: t }))}
                    placeholder="Fix summary (optional before Done)"
                    placeholderTextColor={theme.colors.steel}
                    className="rounded-xl border border-hive-border bg-hive-bg px-3 py-2.5 text-sm text-hive-mist"
                  />
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => void respond(n, true)}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-3"
                    >
                      <CheckCircle2 color="#6ee7b7" size={18} />
                      <Text className="text-emerald-300 font-bold text-sm">Done</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void respond(n, false)}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-white/5 py-3"
                    >
                      <XCircle color={theme.colors.steel} size={18} />
                      <Text className="text-hive-steel font-bold text-sm">Not yet</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
