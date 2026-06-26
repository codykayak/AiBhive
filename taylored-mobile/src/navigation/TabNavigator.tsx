import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, LayoutGrid, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AppsScreen from '../screens/AppsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { SideTabBar } from '../components/SideTabBar';
import { useResponsiveLayout } from '../components/ResponsiveShell';
import { TabBarControlContext } from '../context/TabBarControlContext';
import { colors, radii } from '../theme/colors';
import { countBuildingApps } from '../lib/hiveApps';

const Tab = createBottomTabNavigator();
const SIDE_RAIL_WIDTH = 200;
export const TAB_BAR_BODY_HEIGHT = 58;

function AdaptiveTabBar({
  isDesktop,
  onSideProps,
  ...props
}: BottomTabBarProps & { isDesktop: boolean; onSideProps: (p: BottomTabBarProps) => void }) {
  useEffect(() => {
    if (isDesktop) onSideProps(props);
  }, [isDesktop, onSideProps, props]);

  if (isDesktop) return null;
  return <BottomTabBar {...props} />;
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsiveLayout();
  const bottomInset = Math.max(insets.bottom, 10);
  const [buildingCount, setBuildingCount] = useState(0);
  const [sideProps, setSideProps] = useState<BottomTabBarProps | null>(null);
  const [tabBarHidden, setTabBarHidden] = useState(false);

  const phoneTabBarStyle = useMemo(
    () => ({
      backgroundColor: 'rgba(15, 23, 42, 0.98)',
      borderTopWidth: 0,
      height: TAB_BAR_BODY_HEIGHT + bottomInset,
      paddingTop: 6,
      paddingBottom: bottomInset,
      paddingHorizontal: 12,
      ...Platform.select({
        android: { elevation: 24 },
        ios: {
          shadowColor: colors.amber,
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
      }),
    }),
    [bottomInset]
  );

  useEffect(() => {
    const refresh = () => void countBuildingApps().then(setBuildingCount);
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <TabBarControlContext.Provider value={{ tabBarHidden, setTabBarHidden }}>
      <View style={styles.shell}>
        {isDesktop && sideProps ? (
          <View style={styles.sideRailWrap}>
            <SideTabBar {...sideProps} />
          </View>
        ) : null}
        <View style={[styles.content, isDesktop && { marginLeft: SIDE_RAIL_WIDTH }]}>
          <Tab.Navigator
            safeAreaInsets={{ bottom: isDesktop ? 0 : bottomInset }}
            tabBar={(props) => (
              <AdaptiveTabBar isDesktop={isDesktop} onSideProps={setSideProps} {...props} />
            )}
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
              tabBarStyle: isDesktop
                ? { display: 'none', height: 0 }
                : {
                    ...phoneTabBarStyle,
                    opacity: tabBarHidden ? 0 : 1,
                    pointerEvents: tabBarHidden ? ('none' as const) : ('auto' as const),
                  },
            tabBarBackground: isDesktop
              ? undefined
              : () => (
                  <View style={styles.tabBarBg}>
                    <View style={styles.tabBarGlow} />
                  </View>
                ),
            tabBarItemStyle: { paddingVertical: 2 },
            tabBarActiveTintColor: colors.amberLight,
            tabBarInactiveTintColor: colors.textDim,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '800',
              marginBottom: 2,
              letterSpacing: 0.2,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
                  <Home color={color} size={size} />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Apps"
            component={AppsScreen}
            options={{
              tabBarLabel: 'Toolkit',
              tabBarBadge: buildingCount > 0 ? buildingCount : undefined,
              tabBarBadgeStyle: styles.badge,
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
                  <LayoutGrid color={color} size={size} />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
                  <Settings color={color} size={size} />
                </View>
              ),
            }}
          />
        </Tab.Navigator>
        </View>
      </View>
    </TabBarControlContext.Provider>
  );
}

export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_BODY_HEIGHT + 12;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  sideRailWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDE_RAIL_WIDTH,
    zIndex: 20,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  tabBarGlow: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: colors.amber,
    opacity: 0.5,
    borderRadius: radii.pill,
  },
  iconWrap: {
    padding: 4,
    borderRadius: radii.sm,
  },
  iconWrapOn: {
    backgroundColor: colors.amberSoft,
  },
  badge: {
    backgroundColor: colors.amber,
    color: colors.black,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 18,
    height: 18,
  },
});
