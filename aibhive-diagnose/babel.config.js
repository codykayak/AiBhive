module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind already injects react-native-worklets/plugin.
    // Disabling Expo's auto-injection avoids the duplicate transform that
    // crashes Reanimated 4 / Hermes on Expo Go launch.
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          worklets: false,
          reanimated: false,
        },
      ],
      'nativewind/babel',
    ],
  };
};
