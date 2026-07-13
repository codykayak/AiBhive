import { ScrollView, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import {
  COPPER_PIPE_SIZES,
  DRAIN_SIZING,
  PLUMBING_CODE_REFS,
  PRESSURE_TARGETS,
} from '@/lib/knowledge/plumbing/reference';

export default function PipeChartScreen() {
  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-base text-hive-steel">
        Pipe sizing, drain slope, and code reminders for field plumbing. Verify against local IPC/UPC adoption.
      </Text>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">
        Pressure targets
      </Text>
      <View className="overflow-hidden rounded-sm border border-hive-border">
        {PRESSURE_TARGETS.map((row) => (
          <View key={row.label} className="border-b border-hive-border bg-hive-card px-3 py-3">
            <Text className="font-bold text-hive-mist">{row.label}</Text>
            <Text className="text-hive-amber">{row.psi} psi</Text>
            <Text className="mt-1 text-xs text-hive-steel">{row.note}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">
        Copper / PEX nominal
      </Text>
      <View className="overflow-hidden rounded-sm border border-hive-border">
        <View className="flex-row bg-hive-elevated px-3 py-2">
          <Text className="w-16 font-bold text-hive-steel">Size</Text>
          <Text className="flex-1 font-bold text-hive-steel">OD / ID</Text>
          <Text className="w-20 font-bold text-hive-steel">FU</Text>
        </View>
        {COPPER_PIPE_SIZES.map((row) => (
          <View key={row.nominal} className="flex-row border-t border-hive-border bg-hive-card px-3 py-2">
            <Text className="w-16 text-hive-mist">{row.nominal}</Text>
            <Text className="flex-1 text-sm text-hive-steel">
              {row.odIn}" / {row.idApproxIn}"
            </Text>
            <Text className="w-20 text-sm text-hive-steel">{row.fixtureUnits}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Drain sizing</Text>
      <View className="gap-2">
        {DRAIN_SIZING.map((row) => (
          <View key={row.size} className="rounded-sm border border-hive-border bg-hive-card p-4">
            <Text className="text-lg font-bold text-hive-mist">{row.size}</Text>
            <Text className="text-sm text-hive-steel">{row.use}</Text>
            <Text className="mt-1 text-sm text-hive-amber">Slope: {row.slope}</Text>
            <Text className="mt-1 text-xs text-hive-steel">{row.notes}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Code quick refs</Text>
      {PLUMBING_CODE_REFS.map((ref) => (
        <View key={ref.id} className="mb-3 rounded-sm border border-hive-border bg-hive-elevated p-4">
          <Text className="font-bold text-hive-mist">{ref.title}</Text>
          <Text className="mt-1 text-sm text-hive-steel">{ref.summary}</Text>
          {ref.bullets.map((b) => (
            <Text key={b} className="mt-1 text-sm text-hive-mist">
              • {b}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
