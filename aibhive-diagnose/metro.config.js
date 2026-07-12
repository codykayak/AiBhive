const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Firebase Auth + Expo SDK 53+/57: avoid dual package hazard that throws
// "Component auth has not been registered yet" on launch.
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts || []), 'cjs'])];
config.resolver.unstable_enablePackageExports = false;

const stubPath = path.resolve(__dirname, 'lib/reanimated-expo-go-stub.js');
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === 'react-native-reanimated') {
    return { filePath: stubPath, type: 'sourceFile' };
  }
  if (typeof upstreamResolve === 'function') {
    return upstreamResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
