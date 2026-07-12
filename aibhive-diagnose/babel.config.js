module.exports = function (api) {
  api.cache(true);
  return {
    // Official NativeWind v4 + Expo SDK 57 preset order.
    // Do not disable worklets/reanimated here or add duplicate plugins manually.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
