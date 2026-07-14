import { ScrollView, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import {
  FIBER_CODE_REFS,
  FIBER_LOSS_BUDGET,
  FIBER_WAVELENGTHS,
} from '@/lib/knowledge/fiber/reference';

export default function FiberChartScreen() {
  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-base text-hive-steel">
        Loss budgets, wavelengths, and field safety for fiber optic installs. Verify against project and carrier specs.
      </Text>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">
        Typical loss budget
      </Text>
      {FIBER_LOSS_BUDGET.map((row) => (
        <View key={row.element} className="mb-2 rounded-sm border border-hive-border bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{row.element}</Text>
          <Text className="mt-1 text-sm text-hive-amber">{row.typicalLossDb} dB</Text>
          {row.notes ? <Text className="mt-1 text-xs text-hive-steel">{row.notes}</Text> : null}
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Wavelengths</Text>
      {FIBER_WAVELENGTHS.map((row) => (
        <View key={row.use} className="mb-2 rounded-sm border border-hive-border bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{row.use}</Text>
          <Text className="mt-1 text-sm text-hive-mist">{row.nm} nm</Text>
          <Text className="mt-1 text-xs text-hive-steel">{row.notes}</Text>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Code / safety refs</Text>
      {FIBER_CODE_REFS.map((ref) => (
        <View key={ref.id} className="mb-3 rounded-sm border border-hive-amber/30 bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{ref.title}</Text>
          <Text className="mt-1 text-sm text-hive-steel">{ref.summary}</Text>
          {ref.bullets.map((b) => (
            <Text key={b} className="mt-1 text-sm text-hive-mist">
              · {b}
            </Text>
          ))}
        </View>
      ))}

      <Text className="mt-6 text-xs text-hive-steel" style={{ color: theme.colors.steel }}>
        Laser safety: never view live fiber. Cap unused ports immediately.
      </Text>
    </ScrollView>
  );
}
