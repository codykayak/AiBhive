import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Wand2, Grid, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AppsScreen from '../screens/AppsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const TAB_BAR_BODY_HEIGHT = 58;

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: bottomInset }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopWidth: 1,
          borderTopColor: colors.borderMuted,
          height: TAB_BAR_BODY_HEIGHT + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: colors.amberLight,
        tabBarInactiveTintColor: colors.textDim,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Build"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Build',
          tabBarIcon: ({ color, size }) => <Wand2 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Apps"
        component={AppsScreen}
        options={{
          tabBarLabel: 'My Apps',
          tabBarIcon: ({ color, size }) => <Grid color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_BODY_HEIGHT + 12;
