import '../global.css';

import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

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

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
                  presentation: 'card',
                }}
              />
            </Stack>
          </View>
        </ThemeProvider>
      </PackProvider>
    </NetworkProvider>
  );
}
