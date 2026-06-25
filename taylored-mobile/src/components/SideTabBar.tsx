import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, LayoutGrid, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HiveLogo } from './HiveLogo';
import { colors, radii, spacing } from '../theme/colors';

const ICONS: Record<string, typeof Home> = {
  Home,
  Apps: LayoutGrid,
  Settings,
};

/** Left rail tab bar for Samsung DeX / desktop-width layouts. */
export function SideTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.rail, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.brand}>
        <HiveLogo size={36} glow />
        <Text style={styles.brandText}>AiBhive</Text>
      </View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const Icon = ICONS[route.name] || Home;
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const badge = options.tabBarBadge;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={[styles.item, focused && styles.itemOn]}
          >
            <View style={styles.iconWrap}>
              <Icon color={focused ? colors.amberLight : colors.textDim} size={22} />
              {badge != null ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{String(badge)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelOn]}>{String(label)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flex: 1,
    width: 200,
    backgroundColor: colors.bgElevated,
    borderRightWidth: 1,
    borderRightColor: colors.borderMuted,
    paddingHorizontal: spacing.sm,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandText: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  itemOn: {
    backgroundColor: colors.amberSoft,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  label: {
    color: colors.textDim,
    fontWeight: '700',
    fontSize: 14,
  },
  labelOn: {
    color: colors.amberLight,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.amber,
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
