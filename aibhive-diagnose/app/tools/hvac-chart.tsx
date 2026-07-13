import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import {
  DELTA_T_TARGETS,
  FILTER_GUIDE,
  HVAC_CODE_REFS,
  SUBCOOL_TARGETS,
  SUPERHEAT_TARGETS,
  suggestFilterMerv,
} from '@/lib/knowledge/hvac/reference';

export default function HvacChartScreen() {
  const [staticIn, setStaticIn] = useState('0.45');
  const filterHint = useMemo(() => suggestFilterMerv(Number(staticIn) || 0), [staticIn]);

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-base text-hive-steel">
        Superheat, subcool, delta-T, and filter reminders. Always use the OEM charging chart for the unit on site.
      </Text>

      <View className="mt-5 rounded-sm border border-hive-amber/40 bg-hive-card p-4">
        <Text className="font-bold text-hive-mist">Filter / static pressure</Text>
        <Text className="mt-1 text-xs text-hive-steel">Enter total external static (in. w.c.)</Text>
        <TextInput
          value={staticIn}
          onChangeText={setStaticIn}
          keyboardType="decimal-pad"
          className="mt-2 min-h-[52px] rounded-sm border border-hive-border bg-hive-bg px-3 text-lg text-hive-mist"
          placeholderTextColor={theme.colors.steel}
        />
        <Text className="mt-3 text-sm text-hive-amber">{filterHint}</Text>
      </View>

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Delta-T targets</Text>
      {DELTA_T_TARGETS.map((row) => (
        <View key={row.mode} className="mb-2 rounded-sm border border-hive-border bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{row.mode}</Text>
          <Text className="text-hive-amber">{row.healthySplitF}</Text>
          <Text className="mt-1 text-sm text-hive-steel">{row.notes}</Text>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Superheat</Text>
      {SUPERHEAT_TARGETS.map((row) => (
        <View key={row.refrigerant} className="mb-2 rounded-sm border border-hive-border bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{row.refrigerant}</Text>
          <Text className="text-hive-amber">{row.targetSuperheatF}</Text>
          <Text className="mt-1 text-sm text-hive-steel">{row.conditions}</Text>
          <Text className="mt-1 text-xs text-hive-steel">{row.notes}</Text>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Subcool</Text>
      {SUBCOOL_TARGETS.map((row) => (
        <View key={row.refrigerant} className="mb-2 rounded-sm border border-hive-border bg-hive-card p-4">
          <Text className="font-bold text-hive-mist">{row.refrigerant}</Text>
          <Text className="text-hive-amber">{row.targetSubcoolF}</Text>
          <Text className="mt-1 text-sm text-hive-steel">{row.notes}</Text>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Filter guide</Text>
      {FILTER_GUIDE.map((row) => (
        <View key={row.size} className="mb-2 flex-row rounded-sm border border-hive-border bg-hive-elevated px-4 py-3">
          <Text className="w-24 font-bold text-hive-mist">{row.size}</Text>
          <View className="flex-1">
            <Text className="text-sm text-hive-steel">MERV {row.merv} · {row.changeInterval}</Text>
            <Text className="text-xs text-hive-steel">{row.notes}</Text>
          </View>
        </View>
      ))}

      <Text className="mb-2 mt-8 text-xs font-bold uppercase tracking-wider text-hive-steel">Field reminders</Text>
      {HVAC_CODE_REFS.map((ref) => (
        <View key={ref.id} className="mb-3 rounded-sm border border-hive-border bg-hive-card p-4">
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
