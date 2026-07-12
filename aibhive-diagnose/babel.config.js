module.exports = function (api) {
  api.cache(true);
  return {
    // Standard Expo JSX — no NativeWind/css-interop in the native bundle.
    // NativeWind breaks Expo Go boot via css-interop + worklets (instant crash).
    presets: ['babel-preset-expo'],
  };
};
