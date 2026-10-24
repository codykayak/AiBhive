#!/usr/bin/env node
/**
 * Verify Lead Agent APK is downloadable and looks like a real Android package.
 * Exit 0 = OK, 1 = fail (for CI/local ship gate).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public/lead-agent-releases.json');
const appJsonPath = path.join(root, 'mobile/lead-agent/app.json');

const MIN_APK_BYTES = 8_000_000;
const DOWNLOAD_URL = process.env.LEAD_AGENT_VERIFY_URL || 'https://aibhive.com/api/download/lead-agent';

function fail(msg) {
  console.error('[verify-lead-agent-apk] FAIL:', msg);
  process.exit(1);
}

function ok(msg) {
  console.log('[verify-lead-agent-apk] OK:', msg);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expectedVersion = appJson.expo?.version;
const expectedCode = appJson.expo?.android?.versionCode;

if (!fs.existsSync(manifestPath)) fail(`Missing ${manifestPath} — run publish after build`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.shippedNativeVersion !== expectedVersion) {
  fail(`Manifest version ${manifest.shippedNativeVersion} !== app.json ${expectedVersion}`);
}
if (Number(manifest.versionCode) !== Number(expectedCode)) {
  fail(`Manifest versionCode ${manifest.versionCode} !== app.json ${expectedCode}`);
}
ok(`Manifest v${manifest.shippedNativeVersion} (${manifest.versionCode})`);

if (!manifest.firebaseApkUrl || !manifest.firebaseApkUrl.startsWith('http')) {
  fail('manifest.firebaseApkUrl missing — run npm run lead-agent:ship-local (publish to Firebase first)');
}
const apkUrl = manifest.firebaseApkUrl;
ok(`Download URL: ${apkUrl}`);

const localApk = path.join(root, 'public/lead-agent.apk');
let buf;
if (process.env.LEAD_AGENT_VERIFY_LOCAL === '1' && fs.existsSync(localApk)) {
  buf = fs.readFileSync(localApk);
  ok(`Using local public/lead-agent.apk (${buf.length} bytes)`);
} else {
  const res = await fetch(apkUrl, { redirect: 'follow' });
  if (!res.ok) fail(`HTTP ${res.status} fetching APK`);
  const ab = await res.arrayBuffer();
  buf = Buffer.from(ab);
  ok(`Downloaded ${buf.length} bytes from Firebase/CDN`);
}

if (buf.length < MIN_APK_BYTES) {
  fail(`APK too small (${buf.length} bytes) — likely corrupt or stub`);
}
if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
  fail('Not a ZIP/APK (missing PK header)');
}
ok(`APK size ${(buf.length / 1_000_000).toFixed(1)} MB, valid PK header`);

const apiRes = await fetch(DOWNLOAD_URL, { redirect: 'manual' });
if (apiRes.status !== 302 && apiRes.status !== 200) {
  fail(`/api/download/lead-agent returned ${apiRes.status}`);
}
const loc = apiRes.headers.get('location');
if (apiRes.status === 302 && loc && !loc.includes('firebasestorage')) {
  console.warn('[verify-lead-agent-apk] WARN: redirect is not Firebase —', loc);
}
ok(`aibhive.com/api/download/lead-agent → ${apiRes.status}${loc ? ` → ${loc.slice(0, 60)}…` : ''}`);

console.log('[verify-lead-agent-apk] All checks passed.');
process.exit(0);
