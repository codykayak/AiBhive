import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';

const APP_ICON = require('../icon.png');

export function AiBhiveLogo({ size = 48, rounded = true }: { size?: number; rounded?: boolean }) {
  return (
    <Image
      source={APP_ICON}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
      resizeMode="contain"
      accessibilityLabel="AiBhive"
    />
  );
}

export function DiagnoseOrb({ size = 120 }: { size?: number }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    ring.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, [pulse, ring, spin]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.05]) }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.7, 1.35]) }],
    opacity: interpolate(ring.value, [0, 1], [0.55, 0]),
  }));

  const logoSize = size * 0.62;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: theme.colors.amber,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: size,
            borderWidth: 1.5,
            borderColor: `${theme.colors.pool}88`,
            borderStyle: 'dashed',
          },
          orbitStyle,
        ]}
      />
      <Animated.View style={coreStyle}>
        <AiBhiveLogo size={logoSize} />
      </Animated.View>
    </View>
  );
}

export function PulseLoader({ text = 'Diagnosing…' }: { text?: string }) {
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1, { duration: 350 }), withTiming(0.25, { duration: 350 })),
          -1,
          false
        )
      );
    a.value = bounce(0);
    b.value = bounce(120);
    c.value = bounce(240);
  }, [a, b, c]);

  const sa = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.8, 1.15]) }],
  }));
  const sb = useAnimatedStyle(() => ({
    opacity: interpolate(b.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(b.value, [0, 1], [0.8, 1.15]) }],
  }));
  const sc = useAnimatedStyle(() => ({
    opacity: interpolate(c.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(c.value, [0, 1], [0.8, 1.15]) }],
  }));

  return (
    <View className="flex-row items-center gap-3 rounded-sm border border-hive-border bg-hive-card px-4 py-3">
      <View className="flex-row items-center gap-1.5">
        <Animated.View style={[{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.amber }, sa]} />
        <Animated.View style={[{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.pool }, sb]} />
        <Animated.View
          style={[{ width: 8, height: 8, borderRadius: 8, backgroundColor: theme.colors.electrical }, sc]}
        />
      </View>
      <Text className="text-sm font-semibold text-hive-mist">{text}</Text>
    </View>
  );
}

/** @deprecated Use IntroSplash */
export { IntroSplash as AnimatedSplash } from './IntroSplash';
