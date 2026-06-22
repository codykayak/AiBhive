import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wand2, LayoutGrid, Settings } from 'lucide-react-native';
import { useDexLayout } from '../hooks/useDexLayout';
import { colors, radii } from '../theme/colors';

const ICONS: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  Build: Wand2,
  Apps: LayoutGrid,
  Settings,
};

const LABELS: Record<string, string> = {
  Build: 'Build',
  Apps: 'Apps',
  Settings: 'Settings',
};

export function AdaptiveTabBar(props: BottomTabBarProps) {
  const { useSideNav, sideRailWidth } = useDexLayout();
  const insets = useSafeAreaInsets();

  if (!useSideNav) {
    return <BottomTabBar {...props} />;
  }

  const { state, navigation, descriptors } = props;

  return (
    <View
      style={[
        styles.sideRail,
        {
          width: sideRailWidth + insets.left,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
          paddingLeft: insets.left + 6,
        },
      ]}
    >
      <Text style={styles.railBrand}>AiBhive</Text>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const Icon = ICONS[route.name] ?? Wand2;
        const badge = options.tabBarBadge;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.railItem, focused && styles.railItemOn]}
          >
            <Icon color={focused ? colors.amberLight : colors.textDim} size={22} />
            <Text style={[styles.railLabel, focused && styles.railLabelOn]}>{LABELS[route.name] ?? route.name}</Text>
            {badge != null && badge !== false ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sideRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRightWidth: 1,
    borderRightColor: colors.borderMuted,
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  railBrand: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 4,
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: radii.md,
    width: 64,
  },
  railItemOn: {
    backgroundColor: colors.amberSoft,
  },
  railLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  railLabelOn: {
    color: colors.amberLight,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    backgroundColor: colors.amber,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '900',
  },
});
