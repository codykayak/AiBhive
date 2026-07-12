import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/RootErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { theme } from '@/constants/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { PackProvider } from '@/contexts/PackContext';

export { ErrorBoundary };

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error) setFontTimedOut(true);
  }, [error]);

  useEffect(() => {
    if (loaded || fontTimedOut) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, fontTimedOut]);

  if (!loaded && !fontTimedOut) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bg,
          paddingHorizontal: 24,
        }}
      >
        <StatusBar style="light" />
        <Text style={{ color: theme.colors.amber, fontSize: 18, fontWeight: '800', letterSpacing: 2 }}>
          AiBhive Diagnose
        </Text>
        <Text style={{ color: theme.colors.mist, marginTop: 10, textAlign: 'center', opacity: 0.75 }}>
          Loading the field app…
        </Text>
      </View>
    );
  }

  // Intro splash intentionally disabled — expo-video was crashing Expo Go on launch.
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkProvider>
          <PackProvider>
            <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
              <StatusBar style="light" />
              <OfflineIndicator />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: theme.colors.elevated },
                  headerTintColor: theme.colors.mist,
                  contentStyle: { backgroundColor: theme.colors.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="job/[id]"
                  options={{
                    title: 'Job detail',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="diagnose-session"
                  options={{
                    title: 'Diagnosis',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="fault/[id]"
                  options={{
                    title: 'Fault playbook',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="guided/[id]"
                  options={{
                    title: 'Guided diagnose',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/index"
                  options={{
                    title: 'Field tools',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/chemistry"
                  options={{
                    title: 'Pool chemistry',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/wire-chart"
                  options={{
                    title: 'Wire & torque',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/codes"
                  options={{
                    title: 'Error codes',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/library"
                  options={{
                    title: 'Fault library',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/safety"
                  options={{
                    title: 'Safety checklists',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/howtos"
                  options={{
                    title: 'How-to guides',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/shop-tips"
                  options={{
                    title: 'Shop tips',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="tools/howto/[id]"
                  options={{
                    title: 'How-to',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
                <Stack.Screen
                  name="pack-category/[packId]/[categoryId]"
                  options={{
                    title: 'Category',
                    headerStyle: { backgroundColor: theme.colors.elevated },
                    headerTintColor: theme.colors.mist,
                  }}
                />
              </Stack>
            </View>
          </PackProvider>
        </NetworkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
