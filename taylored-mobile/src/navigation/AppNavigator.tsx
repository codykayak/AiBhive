import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import JewlesWebViewScreen from '../screens/JewlesWebViewScreen';
import AutoBotResumeScreen from '../screens/AutoBotResumeScreen';
import AutoBotResumeResultScreen from '../screens/AutoBotResumeResultScreen';
import DeeperScreen from '../screens/DeeperScreen';

const Stack = createNativeStackNavigator();

const HighTechDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0a',
    card: '#121212',
    text: '#ffffff',
    border: '#333333',
    primary: '#00e5ff',
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={HighTechDarkTheme}>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#00e5ff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}>
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="JewlesWebView" component={JewlesWebViewScreen} options={{ title: 'Jewles' }} />
        <Stack.Screen name="AutoBotResume" component={AutoBotResumeScreen} options={{ title: 'auto-bot=resume' }} />
        <Stack.Screen name="AutoBotResumeResult" component={AutoBotResumeResultScreen} options={{ title: 'Generated Result' }} />
        <Stack.Screen name="Deeper" component={DeeperScreen} options={{ title: 'Company Intel' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
