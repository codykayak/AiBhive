/**
 * React Native 0.85 pins foojay-resolver-convention 0.5.0, which is incompatible
 * with Gradle 9 (Expo SDK 56). Upgrade to 1.0.0 after every npm install.
 */
const fs = require('fs');
const path = require('path');

const settingsFile = path.join(
  __dirname,
  '../node_modules/@react-native/gradle-plugin/settings.gradle.kts'
);

if (!fs.existsSync(settingsFile)) {
  console.log('[patch-foojay] @react-native/gradle-plugin not installed yet, skipping');
  process.exit(0);
}

const original = fs.readFileSync(settingsFile, 'utf8');
const patched = original.replace(
  'foojay-resolver-convention").version("0.5.0")',
  'foojay-resolver-convention").version("1.0.0")'
);

if (original === patched) {
  if (original.includes('foojay-resolver-convention").version("1.0.0")')) {
    console.log('[patch-foojay] Already patched');
  } else {
    console.warn('[patch-foojay] Expected foojay 0.5.0 pin not found; no changes made');
  }
} else {
  fs.writeFileSync(settingsFile, patched);
  console.log('[patch-foojay] Upgraded foojay-resolver-convention to 1.0.0');
}
