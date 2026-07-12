module.exports = function (api) {
  api.cache(true);
  return {
    // Expo preset first (reanimated/worklets disabled — we add worklets LAST below).
    // Do NOT use the nativewind/babel preset: it injects worklets mid-stack, then
    // babel-preset-expo adds more plugins after it, so worklets are not last →
    // Hermes throws "Failed to create a worklet" on launch → "Something went wrong".
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          worklets: false,
          reanimated: false,
        },
      ],
    ],
    plugins: [
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
