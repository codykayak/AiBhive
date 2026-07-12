/**
 * Expo Go safe stub — NativeWind/css-interop pulls reanimated for transitions.
 * When Babel/worklets misconfigure, the real module crashes Hermes on boot.
 * This keeps className styling working without native worklet runtime.
 */
function identity(value) {
  return value;
}

function noop() {}

function makeMutable(initial) {
  return { value: initial };
}

const Easing = {
  linear: identity,
  ease: identity,
  in: () => identity,
  out: () => identity,
  inOut: () => identity,
};

module.exports = {
  default: {},
  Easing,
  cancelAnimation: noop,
  makeMutable,
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: (fn) => fn(),
  withTiming: (value) => value,
  withDelay: (_delay, value) => value,
  withRepeat: (value) => value,
  withSequence: (...values) => values[values.length - 1],
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
};
