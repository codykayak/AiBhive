import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/colors';
import { shadows } from '../theme/shadows';

const LOGO = require('../../assets/aibhive-logo.png');

type Props = {
  size?: number;
  glow?: boolean;
  style?: ViewStyle;
  /** Subtle breathing animation */
  animate?: boolean;
};

/** AiBhive beehive mark — app icon, top bar, onboarding. */
export function HiveLogo({ size = 48, glow = false, style, animate = false }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);

  const img = (
    <Image
      source={LOGO}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        borderWidth: size >= 40 ? 1 : 0,
        borderColor: 'rgba(251, 191, 36, 0.45)',
      }}
      resizeMode="cover"
      accessibilityLabel="AiBhive logo"
    />
  );

  if (!glow && !animate) {
    return <View style={style}>{img}</View>;
  }

  return (
    <View style={[styles.wrap, style]}>
      {glow && <View style={[styles.glow, { width: size * 1.35, height: size * 1.35, borderRadius: size * 0.5 }]} />}
      <Animated.View style={animate ? { transform: [{ scale: pulse }] } : undefined}>{img}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.amberGlow,
    opacity: 0.45,
  },
});
