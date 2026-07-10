import '../global.css';

import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { IntroSplash } from '@/components/IntroSplash';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { theme } from '@/constants/theme';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { PackProvider } from '@/contexts/PackContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const DiagnoseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.amber,
    background: theme.colors.bg,
    card: theme.colors.elevated,
    text: theme.colors.mist,
    border: theme.colors.border,
    notification: theme.colors.amber,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showIntro, setShowIntro] = useState(true);
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    // Don't block the app forever if the font asset stalls on web.
    const timer = setTimeout(() => setFontTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error) {
      // Font failure should not hard-crash the whole app into a blank spinner.
      setFontTimedOut(true);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || fontTimedOut) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, fontTimedOut]);

  const finishIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  if (!loaded && !fontTimedOut) {
    return (
      <View className="flex-1 items-center justify-center bg-hive-bg">
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NetworkProvider>
      <PackProvider>
        <ThemeProvider value={DiagnoseTheme}>
          <View className="flex-1 bg-hive-bg">
            <StatusBar style="light" />
            <OfflineIndicator />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
            </Stack>
            {showIntro ? <IntroSplash onDone={finishIntro} /> : null}
          </View>
        </ThemeProvider>
      </PackProvider>
    </NetworkProvider>
  );
}
