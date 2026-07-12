import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { theme } from '@/constants/theme';

if (Platform.OS === 'web') {
  require('../global.css');
}

export { ErrorBoundary } from '@/components/RootErrorBoundary';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.elevated },
          headerTintColor: theme.colors.mist,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Job detail' }} />
        <Stack.Screen name="diagnose-session" options={{ title: 'Diagnosis' }} />
        <Stack.Screen name="fault/[id]" options={{ title: 'Fault playbook' }} />
        <Stack.Screen name="guided/[id]" options={{ title: 'Guided diagnose' }} />
        <Stack.Screen name="tools/index" options={{ title: 'Field tools' }} />
        <Stack.Screen name="tools/chemistry" options={{ title: 'Pool chemistry' }} />
        <Stack.Screen name="tools/wire-chart" options={{ title: 'Wire & torque' }} />
        <Stack.Screen name="tools/codes" options={{ title: 'Error codes' }} />
        <Stack.Screen name="tools/library" options={{ title: 'Fault library' }} />
        <Stack.Screen name="tools/safety" options={{ title: 'Safety checklists' }} />
        <Stack.Screen name="tools/howtos" options={{ title: 'How-to guides' }} />
        <Stack.Screen name="tools/shop-tips" options={{ title: 'Shop tips' }} />
        <Stack.Screen name="tools/howto/[id]" options={{ title: 'How-to' }} />
        <Stack.Screen
          name="pack-category/[packId]/[categoryId]"
          options={{ title: 'Category' }}
        />
      </Stack>
    </>
  );
}
