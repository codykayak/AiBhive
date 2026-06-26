import React, { createContext, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, Circle } from 'react-native-svg';
import { VersionBadge } from './VersionBadge';
import { HiveLogo } from './HiveLogo';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

const HIVE_BG = require('../../assets/aibhive-background.png');
const HEADER_COLLAPSE = 72;

type ScrollContextValue = {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

type ScreenLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showBrand?: boolean;
  compactBadge?: boolean;
  /** Hide brand/title row when user scrolls down */
  collapsibleHeader?: boolean;
  /** Full-bleed body (Home hero video) while keeping the header padded */
  edgeToEdge?: boolean;
};

export function ScreenLayout({
  children,
  title,
  subtitle,
  style,
  contentStyle,
  showBrand = true,
  compactBadge = false,
  collapsibleHeader = true,
  edgeToEdge = false,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_COLLAPSE * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onScroll = collapsibleHeader
    ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })
    : undefined;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_COLLAPSE],
    outputRange: [showBrand ? 52 : 36, 0],
    extrapolate: 'clamp',
  });

  return (
    <ScrollContext.Provider value={onScroll ? { onScroll } : null}>
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

        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 4, paddingHorizontal: edgeToEdge ? 0 : spacing.lg },
            contentStyle,
          ]}
        >
          <Animated.View
            style={[
              collapsibleHeader
                ? { overflow: 'hidden', height: headerHeight, opacity: headerOpacity }
                : undefined,
              edgeToEdge ? styles.edgeHeader : undefined,
            ]}
          >
            <View style={styles.topRow}>
              {showBrand ? (
                <View style={styles.brandRow}>
                  <HiveLogo size={26} glow />
                  <Text style={styles.brandText}>AiBhive</Text>
                </View>
              ) : (
                <View />
              )}
              <VersionBadge compact={compactBadge} />
            </View>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </Animated.View>
          {children}
        </View>
      </View>
    </ScrollContext.Provider>
  );
}

type ScreenScrollProps = ScrollViewProps & {
  children: React.ReactNode;
};

/** ScrollView wired to ScreenLayout collapsible header */
export function ScreenScrollView({ children, onScroll, contentContainerStyle, style, ...rest }: ScreenScrollProps) {
  const ctx = useContext(ScrollContext);

  const mergedOnScroll = ctx?.onScroll
    ? (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        ctx.onScroll(e);
        if (typeof onScroll === 'function') {
          onScroll(e);
        }
      }
    : onScroll;

  return (
    <Animated.ScrollView
      {...rest}
      style={[styles.scrollView, style]}
      onScroll={mergedOnScroll}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </Animated.ScrollView>
  );
}

ScreenLayout.Scroll = ScreenScrollView;

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
  },
  edgeHeader: {
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    minHeight: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    fontSize: 24,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  scrollView: {
    flex: 1,
  },
});
