import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ResponsiveShell } from './src/components/ResponsiveShell';
import { WelcomeTutorial } from './src/components/WelcomeTutorial';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { checkForOtaUpdate } from './src/lib/appUpdates';
import { preloadHiveMission } from './src/lib/hiveMission';
import { preloadHomeAssistantKnowledge } from './src/lib/homeAssistantKnowledge';
import { isOnboardingDone, markOnboardingDone } from './src/lib/onboarding';
import { initNotificationServices } from './src/lib/notifications';
import { refreshProactiveSchedules } from './src/lib/dailyBriefScheduler';
import { colors } from './src/theme/colors';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    void preloadHiveMission();
    void preloadHomeAssistantKnowledge();
    void checkForOtaUpdate();
    void initNotificationServices().then(() => refreshProactiveSchedules());
    isOnboardingDone().then((done) => {
      if (!done) setShowOnboarding(true);
    });
  }, []);

  const finishOnboarding = async () => {
    await markOnboardingDone();
    setShowOnboarding(false);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ToastProvider>
        <AuthProvider>
          <ResponsiveShell>
            <AppNavigator />
          </ResponsiveShell>
          <WelcomeTutorial visible={showOnboarding} onDone={() => void finishOnboarding()} />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
