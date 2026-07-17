import { Briefcase, Home, Layers, Stethoscope, UserRound, Bell } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { buildTabBarStyle } from '@/constants/tabBar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.elevated },
        headerTintColor: theme.colors.ink,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: theme.colors.ink },
        tabBarActiveTintColor: theme.colors.orange,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: buildTabBarStyle(insets.bottom),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="diagnose"
        options={{
          title: 'Diagnose',
          tabBarIcon: ({ color, size }) => (
            <Stethoscope color={color} size={size} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: 'Packs',
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}
