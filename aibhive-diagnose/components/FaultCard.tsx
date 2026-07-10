import { router } from 'expo-router';
import { AlertTriangle, ChevronRight, Wrench } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { FaultEntry, Severity } from '@/lib/knowledge/types';

const severityColor: Record<Severity, string> = {
  low: theme.colors.steel,
  medium: theme.colors.electrical,
  high: theme.colors.amber,
  critical: theme.colors.danger,
};

export function FaultCard({ fault, compact = false }: { fault: FaultEntry; compact?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/fault/${fault.id}`)}
      className="rounded-2xl border border-hive-border bg-hive-elevated px-4 py-4 active:opacity-80"
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <AlertTriangle color={severityColor[fault.severity]} size={16} strokeWidth={2.5} />
          <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: severityColor[fault.severity] }}>
            {fault.severity}
          </Text>
        </View>
        <Text className="text-xs font-semibold uppercase text-hive-steel">{fault.category}</Text>
      </View>
      <Text className="text-lg font-bold text-hive-mist">{fault.title}</Text>
      {!compact ? (
        <Text className="mt-1 text-sm leading-5 text-hive-steel" numberOfLines={2}>
          {fault.symptoms.slice(0, 2).join(' · ')}
        </Text>
      ) : null}
      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Wrench color={theme.colors.amber} size={14} />
          <Text className="text-xs text-hive-steel">{fault.parts[0] ?? 'Diagnose first'}</Text>
        </View>
        <ChevronRight color={theme.colors.steel} size={18} />
      </View>
    </Pressable>
  );
}
