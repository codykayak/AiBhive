#!/usr/bin/env node
/**
 * Update public/diagnose-mobile-releases.json after AiBhive Diagnose APK deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/diagnose-mobile-releases.json');
const appJsonPath = path.join(root, 'aibhive-diagnose/app.json');

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
manifest.downloadUrl = 'https://aibhive.com/api/download/diagnose-apk';
manifest.fullApkUrl = 'https://aibhive.com/api/download/diagnose-apk';
manifest.publishedAt = new Date().toISOString();
manifest.appName = 'AiBhive Pros';

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
  `v${version} — Pros field app: voice/chat part orders, manual PDF search, parts HQ workflow, keyboard fix, light theme, trade packs, location pings.`;

const notesByVersion = {
  '1.0.2':
    'v1.0.2 — Smarter offline diagnosis (bathtub/plumbing vs dishwasher), Pros AI API fix for APK, keyboard sits on keys, job schedule calendar, light Pros HQ web.',
  '1.0.1':
    'v1.0.1 — AiBhive Pros rebrand, team-code sign-in (no Google on APK), orange intro, new app icon.',
  '1.0.0':
    'v1.0.0 — Field app ship: voice diagnose, order parts, manual lookup, company HQ sync, offline trade packs.',
};
if (notesByVersion[version]) {
  manifest.releaseNotes = notesByVersion[version];
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
console.log('shippedNativeVersion=', version, 'versionCode=', versionCode);
