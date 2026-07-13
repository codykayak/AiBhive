import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';

type CheckItem = { id: string; label: string };

const POOL_CHECKS: CheckItem[] = [
  { id: 'p1', label: 'Kill power at breaker before opening wet ends / heaters' },
  { id: 'p2', label: 'Relieve filter pressure before opening clamp/band' },
  { id: 'p3', label: 'PPE on for acid wash / muriatic' },
  { id: 'p4', label: 'Never mix chemicals in a bucket casually' },
  { id: 'p5', label: 'Verify bonding if customer reports tingles' },
  { id: 'p6', label: 'Gas heater: check venting / CO awareness' },
];

const ELEC_CHECKS: CheckItem[] = [
  { id: 'e1', label: 'LOTO — lock and tag before panel work' },
  { id: 'e2', label: 'Verify absence of voltage (test meter on known live first)' },
  { id: 'e3', label: 'PPE / arc-flash awareness for the task' },
  { id: 'e4', label: 'Don’t upsize breakers to “fix” trips' },
  { id: 'e5', label: 'Open neutral / hot panel = prioritize safety' },
  { id: 'e6', label: 'Keep working clearances clear; photo documentation' },
];

const PROPERTY_CHECKS: CheckItem[] = [
  { id: 'm1', label: 'Unplug / kill breaker before opening appliances' },
  { id: 'm2', label: 'Shut gas / water before water heater or disposal work' },
  { id: 'm3', label: 'Never put hands in a disposal with power available' },
  { id: 'm4', label: 'Confirm dryer vent clear before replacing thermal fuse' },
  { id: 'm5', label: 'Photo serial / model before ordering parts' },
  { id: 'm6', label: 'If electrical panel or pool gear — switch to that pack checklist' },
];

export default function SafetyScreen() {
  const { activePack } = usePack();
  const items =
    activePack.id === 'pool'
      ? POOL_CHECKS
      : activePack.id === 'property'
        ? PROPERTY_CHECKS
        : ELEC_CHECKS;
  const [done, setDone] = useState<Record<string, boolean>>({});

  const completed = items.filter((i) => done[i.id]).length;

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text className="text-2xl font-bold text-hive-mist">{activePack.shortName} safety</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Tap each item before you dig in. {completed}/{items.length} cleared.
      </Text>

      <View className="mt-4 h-2 overflow-hidden rounded-full bg-hive-card">
        <View
          className="h-full rounded-full bg-hive-success"
          style={{ width: `${(completed / items.length) * 100}%` }}
        />
      </View>

      <View className="mt-6 gap-3">
        {items.map((item) => {
          const on = Boolean(done[item.id]);
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void Haptics.selectionAsync();
                setDone((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
              }}
              className={`min-h-[64px] flex-row items-center gap-3 rounded-sm border px-4 py-3 active:opacity-80 ${on ? 'border-hive-success/50 bg-hive-success/10' : 'border-hive-border bg-hive-elevated'}`}
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-full border"
                style={{
                  borderColor: on ? theme.colors.success : theme.colors.border,
                  backgroundColor: on ? theme.colors.success : 'transparent',
                }}
              >
                {on ? <Text className="font-bold text-hive-bg">✓</Text> : null}
              </View>
              <Text className={`flex-1 text-base ${on ? 'text-hive-mist' : 'text-hive-steel'}`}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
