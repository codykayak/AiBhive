import '../global.css';

import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
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

/**
 * Web static export SSR used to paint the full-screen black intro overlay
 * before JS hydrated. Cursor's port-forward preview often never finishes JS,
 * so users saw a permanent black screen. Default: no intro on web.
 * Replay with ?intro=1
 */
function shouldPlayIntro(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('intro') === '1';
  } catch {
    return false;
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showIntro, setShowIntro] = useState(() => Platform.OS !== 'web');
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    // Web: intro only when explicitly requested (?intro=1). Avoids black SSR overlay.
    if (Platform.OS === 'web') {
      setShowIntro(shouldPlayIntro());
    }
  }, []);

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
      <View
        className="flex-1 items-center justify-center bg-hive-bg px-6"
        style={{ backgroundColor: theme.colors.bg }}
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
