import { BookOpen, Calculator, Cable, ListChecks, ScanSearch, Shield } from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { usePack } from '@/contexts/PackContext';

const TOOLS: Array<{
  href: Href;
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  color: string;
}> = [
  {
    href: '/tools/library',
    title: 'Fault library',
    subtitle: 'Search every common field failure',
    icon: BookOpen,
    color: theme.colors.amber,
  },
  {
    href: '/tools/howtos' as Href,
    title: 'How-to guides',
    subtitle: 'Filters, disposal, fridge, water heaters',
    icon: BookOpen,
    color: '#7C9A6E',
  },
  {
    href: '/tools/codes',
    title: 'Error code lookup',
    subtitle: 'Pentair, Hayward, Jandy, AFCI/VFD…',
    icon: ScanSearch,
    color: theme.colors.pool,
  },
  {
    href: '/tools/chemistry',
    title: 'Pool chemistry lab',
    subtitle: 'Targets + dosing estimators',
    icon: Calculator,
    color: theme.colors.pool,
  },
  {
    href: '/tools/wire-chart',
    title: 'Wire & torque charts',
    subtitle: 'Ampacity + lug reminders',
    icon: Cable,
    color: theme.colors.electrical,
  },
  {
    href: '/tools/safety',
    title: 'Safety checklists',
    subtitle: 'LOTO, gas, chemical, bonding',
    icon: Shield,
    color: theme.colors.danger,
  },
];

export default function ToolsHubScreen() {
  const { activePack } = usePack();

  return (
    <ScrollView className="flex-1 bg-hive-bg" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-hive-mist">Field tools</Text>
      <Text className="mt-1 text-base text-hive-steel">
        Pocket references tuned for {activePack.shortName} work — fast, offline-friendly, glove-ready.
      </Text>

      <View className="mt-6 gap-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Pressable
              key={tool.title}
              onPress={() => router.push(tool.href)}
              className="min-h-[76px] flex-row items-center gap-4 rounded-2xl border border-hive-border bg-hive-elevated px-4 py-4 active:opacity-80"
            >
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${tool.color}22` }}
              >
                <Icon color={tool.color} size={26} strokeWidth={2.4} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-hive-mist">{tool.title}</Text>
                <Text className="mt-0.5 text-sm text-hive-steel">{tool.subtitle}</Text>
              </View>
              <ListChecks color={theme.colors.steel} size={18} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
