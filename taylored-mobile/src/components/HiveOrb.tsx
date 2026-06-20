import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  size?: number;
  active?: boolean;
};

/** Pulsing amber orb — Hive is alive. */
export function HiveOrb({ size = 56, active = true }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.timing(spin, { toValue: 1, duration: 8000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, spin]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate }],
          },
        ]}
      >
        <View style={[styles.inner, { borderRadius: size / 2 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: colors.amberGlow,
  },
  core: {
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.amberLight,
  },
  inner: {
    width: '55%',
    height: '55%',
    backgroundColor: colors.amberLight,
    opacity: 0.85,
  },
});
