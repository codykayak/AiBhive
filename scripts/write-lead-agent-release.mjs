#!/usr/bin/env node
/** Update public/lead-agent-releases.json after Lead Agent APK publish. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/lead-agent-releases.json');
const appJsonPath = path.join(root, 'mobile/lead-agent/app.json');

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
manifest.appName = 'AiBhive Lead Agent';
manifest.downloadUrl = 'https://aibhive.com/api/download/lead-agent';
manifest.fullApkUrl = 'https://aibhive.com/api/download/lead-agent';
manifest.publishedAt = new Date().toISOString();

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
  `v${version} — MacroREI Lead Agent: owner lists, paced SMS (Android), Grok on macrorei.com, team workspace sharing.`;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Updated', manifestPath);
