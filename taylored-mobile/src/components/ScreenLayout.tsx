import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { VersionBadge } from './VersionBadge';
import { colors, spacing } from '../theme/colors';

type ScreenLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showBrand?: boolean;
};

export function ScreenLayout({
  children,
  title,
  subtitle,
  style,
  contentStyle,
  showBrand = true,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#020617" />
              <Stop offset="0.55" stopColor="#0f172a" />
              <Stop offset="1" stopColor="#111827" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg)" />
        </Svg>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + spacing.sm }, contentStyle]}>
        <VersionBadge />
        {!!title && <Text style={styles.title}>{title}</Text>}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.amberGlow,
    opacity: 0.35,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  brandRow: {
    display: 'none',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
});
