import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import EnterpriseWebViewScreen from '../screens/EnterpriseWebViewScreen';
import AutoBotResumeScreen from '../screens/AutoBotResumeScreen';
import AutoBotResumeResultScreen from '../screens/AutoBotResumeResultScreen';
import DeeperScreen from '../screens/DeeperScreen';
import JobTrackerScreen from '../screens/JobTrackerScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import UserGuideScreen from '../screens/UserGuideScreen';
import HiveAppDetailScreen from '../screens/HiveAppDetailScreen';
import UserAppHostScreen from '../screens/UserAppHostScreen';
import { HIVE_USER_APPS } from '../userApps';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['aibhive://', 'https://aibhive.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Build: 'build',
          Apps: 'apps',
          Settings: 'settings',
        },
      },
      UserApp: 'userApps/:slug',
      HiveAppDetail: 'apps/detail',
      UserGuide: 'guide',
    },
  },
};

const AiBhiveTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.borderMuted,
    primary: colors.amber,
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={AiBhiveTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.amberLight,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="EnterpriseWebView"
          component={EnterpriseWebViewScreen}
          options={{ title: 'AiBhive Enterprise' }}
        />
        <Stack.Screen name="AutoBotResume" component={AutoBotResumeScreen} options={{ title: 'Auto-Bot Resume' }} />
        <Stack.Screen name="AutoBotResumeResult" component={AutoBotResumeResultScreen} options={{ title: 'Application Kit' }} />
        <Stack.Screen name="Deeper" component={DeeperScreen} options={{ title: 'Company Intel' }} />
        <Stack.Screen name="JobTracker" component={JobTrackerScreen} options={{ title: 'Job Tracker' }} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Profile' }} />
        <Stack.Screen name="UserGuide" component={UserGuideScreen} options={{ title: 'User Guide' }} />
        <Stack.Screen name="HiveAppDetail" component={HiveAppDetailScreen} options={{ title: 'Your App' }} />
        <Stack.Screen name="UserApp" component={UserAppHostScreen} options={{ title: 'Hive App' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { HIVE_USER_APPS };
