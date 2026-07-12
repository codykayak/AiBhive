const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { expoGoManifestMiddleware } = require('./lib/expo-go-metro-middleware');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts || []), 'cjs'])];
config.resolver.unstable_enablePackageExports = false;

const stubReanimated = path.resolve(__dirname, 'lib/reanimated-expo-go-stub.js');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === 'react-native-reanimated') {
    return { filePath: stubReanimated, type: 'sourceFile' };
  }
  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

const withWind = withNativeWind(config, { input: './global.css' });
const priorEnhance = withWind.server?.enhanceMiddleware;

withWind.server = {
  ...withWind.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const base = priorEnhance ? priorEnhance(middleware, metroServer) : middleware;
    return expoGoManifestMiddleware(base);
  },
};

module.exports = withWind;
