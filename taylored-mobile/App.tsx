import React, { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ResponsiveShell } from './src/components/ResponsiveShell';
import { checkForOtaUpdate } from './src/lib/otaUpdates';
import { preloadHiveMission } from './src/lib/hiveMission';
import { colors } from './src/theme/colors';

export default function App() {
  useEffect(() => {
    void preloadHiveMission();
    void checkForOtaUpdate();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ResponsiveShell>
        <AppNavigator />
      </ResponsiveShell>
    </SafeAreaProvider>
  );
}
