#!/usr/bin/env node
/** After expo prebuild, wire release signing to credentials/android-release.keystore copy. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = path.join(root, 'android/app/build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error('Missing', gradlePath);
  process.exit(1);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (!gradle.includes('taylored-release')) {
  gradle = gradle.replace(
    /signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\}\s*\}/,
    `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'taylored2026'
            keyAlias 'taylored-release'
            keyPassword 'taylored2026'
        }
    }`
  );
}

gradle = gradle.replace(
  /(buildTypes\s*\{\s*debug\s*\{[\s\S]*?\}\s*release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
  '$1signingConfig signingConfigs.release'
);

fs.writeFileSync(gradlePath, gradle);
console.log('Patched release signing in android/app/build.gradle');
