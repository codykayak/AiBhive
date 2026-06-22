import React from 'react';
import { ImageBackground, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, Circle } from 'react-native-svg';
import { VersionBadge } from './VersionBadge';
import { HiveLogo } from './HiveLogo';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { useDexLayout } from '../hooks/useDexLayout';

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
  /** Less chrome for chat-heavy screens on DeX */
  compactDex?: boolean;
};

export function ScreenLayout({
  children,
  title,
  subtitle,
  style,
  contentStyle,
  showBrand = true,
  compactBadge = false,
  compactDex = false,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isDex, isDesktop, contentPadding } = useDexLayout();
  const liteBg = isDex || compactDex;

  return (
    <View style={[styles.root, style]}>
      <ImageBackground
        source={HIVE_BG}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={[styles.bgImage, liteBg && styles.bgImageDex]}
      >
        <View style={[styles.bgDim, liteBg && styles.bgDimDex]} />
      </ImageBackground>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#01040f" stopOpacity={liteBg ? 0.45 : 0.72} />
              <Stop offset="0.45" stopColor="#0f172a" stopOpacity={liteBg ? 0.55 : 0.82} />
              <Stop offset="1" stopColor="#1a1033" stopOpacity={liteBg ? 0.6 : 0.88} />
            </LinearGradient>
            <LinearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.amber} stopOpacity={liteBg ? 0.12 : 0.2} />
              <Stop offset="1" stopColor={colors.purple} stopOpacity={liteBg ? 0.04 : 0.06} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg)" />
          <Circle cx="85%" cy="8%" r="120" fill="url(#glow)" opacity={liteBg ? 0.25 : 0.45} />
          <Circle cx="10%" cy="75%" r="90" fill={colors.amberGlow} opacity={liteBg ? 0.08 : 0.15} />
        </Svg>
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: (compactDex ? insets.top + 4 : insets.top + spacing.sm),
            paddingHorizontal: isDesktop ? contentPadding : spacing.lg,
          },
          contentStyle,
        ]}
      >
        {!(compactDex && isDesktop) && (
          <View style={[styles.topRow, compactDex && styles.topRowCompact]}>
            {showBrand ? (
              <View style={styles.brandRow}>
                <HiveLogo size={compactDex ? 28 : 32} glow />
                <Text style={[styles.brandText, compactDex && styles.brandTextCompact]}>AiBhive</Text>
              </View>
            ) : (
              <View />
            )}
            <VersionBadge compact={compactBadge} />
          </View>
        )}
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
  bgImageDex: {
    opacity: 0.38,
  },
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  bgDimDex: {
    backgroundColor: 'rgba(2, 6, 23, 0.18)',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    minHeight: 28,
  },
  topRowCompact: {
    minHeight: 24,
    marginBottom: 2,
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
  brandTextCompact: {
    fontSize: 14,
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
