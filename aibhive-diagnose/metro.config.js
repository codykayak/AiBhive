const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase Auth + Expo SDK 53+/57: avoid dual package hazard that throws
// "Component auth has not been registered yet" on launch.
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts || []), 'cjs'])];
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
