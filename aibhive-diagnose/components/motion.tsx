import { useEffect } from 'react';
import { Text, View } from 'react-native';
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

export function DiagnoseOrb({ size = 120, label = 'AiBhive' }: { size?: number; label?: string }) {
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
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.85, 1]),
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.7, 1.35]) }],
    opacity: interpolate(ring.value, [0, 1], [0.55, 0]),
  }));

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
      <Animated.View
        style={[
          {
            width: size * 0.58,
            height: size * 0.58,
            borderRadius: size,
            backgroundColor: theme.colors.amber,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.colors.amber,
            shadowOpacity: 0.55,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          },
          coreStyle,
        ]}
      >
        <Text style={{ color: theme.colors.bg, fontWeight: '800', fontSize: size * 0.11 }}>{label}</Text>
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
    <View className="flex-row items-center gap-3 rounded-2xl border border-hive-border bg-hive-card px-4 py-3">
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

export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const progress = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) });
    const fadeTimer = setTimeout(() => {
      fade.value = withTiming(0, { duration: 400 });
    }, 1700);
    const doneTimer = setTimeout(onDone, 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [fade, onDone, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [8, 100])}%`,
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  return (
    <Animated.View
      style={[
        { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
        wrapStyle,
      ]}
    >
      <DiagnoseOrb size={140} label="Diagnose" />
      <Text className="mt-8 font-mono text-xs font-bold uppercase tracking-[4px] text-hive-amber">TradeForge</Text>
      <Text className="mt-2 text-3xl font-bold text-hive-mist">AiBhive Diagnose</Text>
      <Text className="mt-2 text-center text-sm text-hive-steel">
        Loading field intelligence for Pool + Electrical…
      </Text>
      <View className="mt-10 h-1.5 w-56 overflow-hidden rounded-full bg-hive-card">
        <Animated.View style={[{ height: '100%', backgroundColor: theme.colors.amber, borderRadius: 99 }, barStyle]} />
      </View>
    </Animated.View>
  );
}
