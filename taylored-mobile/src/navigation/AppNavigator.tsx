import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import JewlesWebViewScreen from '../screens/JewlesWebViewScreen';
import AutoBotResumeScreen from '../screens/AutoBotResumeScreen';
import AutoBotResumeResultScreen from '../screens/AutoBotResumeResultScreen';
import DeeperScreen from '../screens/DeeperScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

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
    <NavigationContainer theme={AiBhiveTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.amberLight,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="JewlesWebView" component={JewlesWebViewScreen} options={{ title: 'Jewles' }} />
        <Stack.Screen name="AutoBotResume" component={AutoBotResumeScreen} options={{ title: 'Auto-Bot Resume' }} />
        <Stack.Screen name="AutoBotResumeResult" component={AutoBotResumeResultScreen} options={{ title: 'Application Kit' }} />
        <Stack.Screen name="Deeper" component={DeeperScreen} options={{ title: 'Company Intel' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
