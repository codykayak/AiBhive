#!/usr/bin/env node
/**
 * Update public/plants-mobile-releases.json after Living Knowledge Plants APK deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/plants-mobile-releases.json');
const appJsonPath = path.join(root, 'aibhive-plants/app.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const args = process.argv.slice(2);
const firebaseApkUrl = args.includes('--firebase-apk-url')
  ? args[args.indexOf('--firebase-apk-url') + 1]
  : undefined;
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
manifest.downloadUrl = 'https://aibhive.com/api/download/plants-apk';
manifest.fullApkUrl = 'https://aibhive.com/api/download/plants-apk';
manifest.publishedAt = new Date().toISOString();
manifest.appName = expo.name || 'AiBhivePlants';
manifest.playStoreStatus = manifest.playStoreStatus || 'pending_approval';

if (firebaseApkUrl) {
  manifest.firebaseApkUrl = firebaseApkUrl;
  manifest.downloadUrl = firebaseApkUrl;
  manifest.fullApkUrl = firebaseApkUrl;
}
if (firebaseGzUrl) {
  manifest.firebaseGzUrl = firebaseGzUrl;
}

manifest.releaseNotes =
  manifest.releaseNotes ||
  `v${version} — AiBhivePlants Android app for aibhive.com/plants: wild plant ID, community posts, holistic libraries, and Hive Research photo identification.`;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
console.log('shippedNativeVersion=', version, 'versionCode=', versionCode);
