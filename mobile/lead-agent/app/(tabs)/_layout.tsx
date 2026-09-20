import { Tabs } from 'expo-router';
import { useApp } from '../../lib/context';

export default function TabsLayout() {
  const { active } = useApp();
  const tint = active?.brandColor || '#1e4d2b';
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: tint, headerStyle: { backgroundColor: '#fff' } }}>
      <Tabs.Screen name="leads" options={{ title: 'Leads' }} />
      <Tabs.Screen name="automation" options={{ title: 'Automation' }} />
      <Tabs.Screen name="dialer" options={{ title: 'Dial / SMS' }} />
      <Tabs.Screen name="workmode" options={{ title: 'Work Mode' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
