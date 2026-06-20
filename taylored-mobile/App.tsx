import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ResponsiveShell } from './src/components/ResponsiveShell';
import { OnboardingOverlay } from './src/components/OnboardingOverlay';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { checkForOtaUpdate } from './src/lib/appUpdates';
import { preloadHiveMission } from './src/lib/hiveMission';
import { isOnboardingDone, markOnboardingDone } from './src/lib/onboarding';
import { colors } from './src/theme/colors';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    void preloadHiveMission();
    void checkForOtaUpdate();
    isOnboardingDone().then((done) => {
      if (!done) setShowOnboarding(true);
    });
  }, []);

  const finishOnboarding = async () => {
    await markOnboardingDone();
    setShowOnboarding(false);
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ToastProvider>
        <AuthProvider>
          <ResponsiveShell>
            <AppNavigator />
          </ResponsiveShell>
          <OnboardingOverlay visible={showOnboarding} onDone={() => void finishOnboarding()} />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
