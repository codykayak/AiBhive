import React, { useRef } from 'react';
import { NavigationContainer, DarkTheme, type NavigationContainerRef } from '@react-navigation/native';
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
import DynamicAppHost from '../dynamicApps/DynamicAppHost';
import HiveExportOptionsScreen from '../screens/HiveExportOptionsScreen';
import AppCustomizeScreen from '../screens/AppCustomizeScreen';
import IntelCaseScreen from '../screens/IntelCaseScreen';
import IntelAgentScreen from '../screens/IntelAgentScreen';
import BuildScreen from '../screens/BuildScreen';
import { HIVE_USER_APPS } from '../userApps';
import { colors } from '../theme/colors';
import { useNavigationActivityLogger } from '../hooks/useNavigationActivityLogger';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['aibhive://', 'https://aibhive.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Apps: 'apps',
          Settings: 'settings',
        },
      },
      HiveBuild: 'build',
      IntelAgent: 'intel',
      IntelCase: 'intel/case/:caseId',
      UserApp: 'userApps/:slug',
      DynamicApp: 'app/:appId',
      HiveExportOptions: 'app/:appId/export',
      AppCustomize: 'app/:appId/customize',
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
  const navRef = useRef<NavigationContainerRef<any>>(null);
  useNavigationActivityLogger(navRef);

  return (
    <NavigationContainer ref={navRef} theme={AiBhiveTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.amberLight,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="EnterpriseWebView" component={EnterpriseWebViewScreen} options={{ headerShown: false, title: 'AiBhive Enterprise' }} />
        <Stack.Screen name="AutoBotResume" component={AutoBotResumeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AutoBotResumeResult" component={AutoBotResumeResultScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Deeper" component={DeeperScreen} options={{ headerShown: false }} />
        <Stack.Screen name="JobTracker" component={JobTrackerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserGuide" component={UserGuideScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HiveAppDetail" component={HiveAppDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserApp" component={UserAppHostScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DynamicApp" component={DynamicAppHost} options={{ headerShown: false }} />
        <Stack.Screen name="HiveExportOptions" component={HiveExportOptionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppCustomize" component={AppCustomizeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HiveBuild" component={BuildScreen} options={{ headerShown: false }} />
        <Stack.Screen name="IntelAgent" component={IntelAgentScreen} options={{ headerShown: false }} />
        <Stack.Screen name="IntelCase" component={IntelCaseScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { HIVE_USER_APPS };
