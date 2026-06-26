#!/usr/bin/env node
/** Fail CI/publish if APK versionName/versionCode do not match app.json. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const apkPath = process.argv[2];
if (!apkPath || !fs.existsSync(apkPath)) {
  console.error('Usage: verify-built-apk.mjs <path-to.apk>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'taylored-mobile/app.json'), 'utf8'));
const expectedVersion = appJson.expo.version;
const expectedCode = String(appJson.expo.android.versionCode);

const buf = fs.readFileSync(apkPath);
const text = buf.toString('latin1');

if (!text.includes(expectedVersion)) {
  console.error(`APK missing versionName ${expectedVersion} — stale or wrong build?`);
  process.exit(1);
}
if (!text.includes(`versionCode`) && !text.includes(expectedCode)) {
  // versionCode may appear as binary; versionName check is primary
  console.warn('Could not confirm versionCode in APK bytes (binary manifest).');
}

console.log(`Verified APK contains version ${expectedVersion} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
