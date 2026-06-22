import React from 'react';
import { ImageBackground, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, Circle } from 'react-native-svg';
import { VersionBadge } from './VersionBadge';
import { HiveLogo } from './HiveLogo';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const HIVE_BG = require('../../assets/aibhive-background.png');

type ScreenLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showBrand?: boolean;
  /** Smaller, subtler version badge */
  compactBadge?: boolean;
};

export function ScreenLayout({
  children,
  title,
  subtitle,
  style,
  contentStyle,
  showBrand = false,
  compactBadge = false,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, style]}>
      <ImageBackground
        source={HIVE_BG}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={styles.bgImage}
      >
        <View style={styles.bgDim} />
      </ImageBackground>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#01040f" stopOpacity="0.72" />
              <Stop offset="0.45" stopColor="#0f172a" stopOpacity="0.82" />
              <Stop offset="1" stopColor="#1a1033" stopOpacity="0.88" />
            </LinearGradient>
            <LinearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.amber} stopOpacity="0.2" />
              <Stop offset="1" stopColor={colors.purple} stopOpacity="0.06" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg)" />
          <Circle cx="85%" cy="8%" r="120" fill="url(#glow)" opacity={0.45} />
          <Circle cx="10%" cy="75%" r="90" fill={colors.amberGlow} opacity={0.15} />
        </Svg>
      </View>

      <View style={[styles.content, { paddingTop: insets.top + spacing.sm }, contentStyle]}>
        <View style={styles.topRow}>
          {showBrand ? (
            <View style={styles.brandRow}>
              <HiveLogo size={32} glow />
              <Text style={styles.brandText}>AiBhive</Text>
            </View>
          ) : (
            <View />
          )}
          <VersionBadge compact={compactBadge} />
        </View>
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
  bgImage: {
    opacity: 0.55,
  },
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    minHeight: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
});
