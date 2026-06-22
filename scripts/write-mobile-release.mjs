#!/usr/bin/env node
/**
 * Update public/mobile-releases.json after an APK deploy or Firebase mirror publish.
 * Usage:
 *   node scripts/write-mobile-release.mjs
 *   node scripts/write-mobile-release.mjs --firebase-gz-url "https://..."
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/mobile-releases.json');
const appJsonPath = path.join(root, 'taylored-mobile/app.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const args = process.argv.slice(2);
const firebaseGzUrl = args.includes('--firebase-gz-url')
  ? args[args.indexOf('--firebase-gz-url') + 1]
  : undefined;

const appJson = readJson(appJsonPath);
const expo = appJson.expo || {};
const version = expo.version || '1.0.0';
const versionCode = expo.android?.versionCode ?? 1;

let manifest = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = readJson(manifestPath);
  } catch {
    manifest = {};
  }
}

manifest.shippedNativeVersion = version;
manifest.versionCode = versionCode;
manifest.sourceVersion = version;
manifest.downloadUrl = manifest.downloadUrl || 'https://aibhive.com/api/download/apk?compressed=1';
manifest.fullApkUrl = manifest.fullApkUrl || 'https://aibhive.com/api/download/apk';
manifest.publishedAt = new Date().toISOString();
manifest.otaChannel = manifest.otaChannel || 'production';

if (firebaseGzUrl) {
  manifest.firebaseGzUrl = firebaseGzUrl;
}

if (!manifest.releaseNotes) {
  manifest.releaseNotes = `Taylored Mobile v${version}`;
}

const defaultNotes = {
  '1.2.2':
    'v1.2.2 — Epic Hive UI, welcome tutorial, Hive Magic pricing/limits, Play Store prep, in-app update checks.',
  '1.3.1':
    'v1.3.1 — User Guide (how builds become apps), app detail screen, keyboard dismiss on send.',
};
if (defaultNotes[version]) {
  manifest.releaseNotes = defaultNotes[version];
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
console.log('shippedNativeVersion=', version, 'versionCode=', versionCode);
