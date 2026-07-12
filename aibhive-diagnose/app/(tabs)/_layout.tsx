import { Tabs } from 'expo-router';

import { theme } from '@/constants/theme';
import { AppProviders } from '@/components/AppProviders';

export default function TabLayout() {
  return (
    <AppProviders>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.elevated },
          headerTintColor: theme.colors.mist,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          tabBarActiveTintColor: theme.colors.amber,
          tabBarInactiveTintColor: theme.colors.steel,
          tabBarStyle: {
            backgroundColor: theme.colors.elevated,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="diagnose" options={{ title: 'Diagnose' }} />
        <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
        <Tabs.Screen name="packs" options={{ title: 'Packs' }} />
        <Tabs.Screen name="account" options={{ title: 'Account' }} />
      </Tabs>
    </AppProviders>
  );
}
