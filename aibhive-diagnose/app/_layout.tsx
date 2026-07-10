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

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const finishIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  if (!loaded) {
    return null;
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
