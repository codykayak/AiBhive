import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import {
  CODE_QUICK_REFS,
  COMMON_TORQUE,
  COPPER_AMPACITY,
  suggestWireForAmps,
} from '@/lib/knowledge/electrical/reference';

export default function WireChartScreen() {
  const [amps, setAmps] = useState('30');
  const suggestion = useMemo(() => suggestWireForAmps(Number(amps) || 0, 75), [amps]);

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-base text-hive-steel">
        Quick copper ampacity + torque reminders. Always verify against the current NEC and equipment labels.
      </Text>

      <View className="mt-5 rounded-2xl border border-hive-amber/40 bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">Wire suggester (75°C Cu)</Text>
        <Text className="mt-1 text-xs text-hive-steel">Enter load amps</Text>
        <TextInput
          value={amps}
          onChangeText={setAmps}
          keyboardType="number-pad"
          className="mt-2 min-h-[52px] rounded-xl border border-hive-border bg-hive-bg px-3 text-lg text-hive-mist"
          placeholderTextColor={theme.colors.steel}
        />
        <Text className="mt-3 text-lg font-bold text-hive-amber">
          {suggestion ? `Try AWG ${suggestion.awg} (≥ ${suggestion.copper75}A @ 75°C)` : 'No match'}
        </Text>
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Copper ampacity</Text>
      <View className="overflow-hidden rounded-2xl border border-hive-border">
        <View className="flex-row bg-hive-card px-3 py-2">
          <Text className="w-16 font-bold text-hive-steel">AWG</Text>
          <Text className="flex-1 font-bold text-hive-steel">60°</Text>
          <Text className="flex-1 font-bold text-hive-steel">75°</Text>
          <Text className="flex-1 font-bold text-hive-steel">90°</Text>
        </View>
        {COPPER_AMPACITY.map((row) => (
          <View key={row.awg} className="flex-row border-t border-hive-border bg-hive-elevated px-3 py-2.5">
            <Text className="w-16 font-bold text-hive-mist">{row.awg}</Text>
            <Text className="flex-1 text-hive-steel">{row.copper60}</Text>
            <Text className="flex-1 text-hive-mist">{row.copper75}</Text>
            <Text className="flex-1 text-hive-steel">{row.copper90}</Text>
          </View>
        ))}
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Torque reminders</Text>
      {COMMON_TORQUE.map((row) => (
        <View key={row.item} className="mb-2 rounded-2xl border border-hive-border bg-hive-elevated px-4 py-3">
          <Text className="font-bold text-hive-mist">{row.item}</Text>
          <Text className="text-hive-amber">{row.torque}</Text>
          <Text className="text-sm text-hive-steel">{row.note}</Text>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Code quick refs</Text>
      {CODE_QUICK_REFS.map((ref) => (
        <View key={ref.id} className="mb-3 rounded-2xl border border-hive-border bg-hive-elevated px-4 py-4">
          <Text className="text-lg font-bold text-hive-mist">{ref.title}</Text>
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
