#!/usr/bin/env node
/**
 * Upload Lead Agent APK to Firebase Storage (APK is too large for GitHub; Cloud Run uses redirect).
 * Input: public/lead-agent.apk or mobile/lead-agent/android/.../app-debug.apk
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  path.join(root, 'public/lead-agent.apk'),
  path.join(root, 'mobile/lead-agent/android/app/build/outputs/apk/debug/app-debug.apk'),
];

const apkPath = candidates.find((p) => fs.existsSync(p));
if (!apkPath) {
  console.error('No Lead Agent APK found. Run: npm run lead-agent:phone');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase-applet-config.json'), 'utf8'));
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  appId: config.appId,
  messagingSenderId: config.messagingSenderId,
});

const apk = fs.readFileSync(apkPath);
const gz = await gzip(apk);
await signInAnonymously(getAuth(app));

const sessionId = `lead-agent-apk-${Date.now()}`;
const storage = getStorage(app);

const apkRef = ref(storage, `leads/${sessionId}/aibhive-lead-agent.apk`);
await uploadBytes(apkRef, apk, { contentType: 'application/vnd.android.package-archive' });
const firebaseApkUrl = await getDownloadURL(apkRef);

const gzRef = ref(storage, `leads/${sessionId}/aibhive-lead-agent.apk.gz`);
await uploadBytes(gzRef, gz, { contentType: 'application/gzip' });
const gzUrl = await getDownloadURL(gzRef);

// Stable mirror path (requires storage.rules mobile/* deploy)
try {
  const mirrorRef = ref(storage, 'mobile/aibhive-lead-agent.apk');
  await uploadBytes(mirrorRef, apk, { contentType: 'application/vnd.android.package-archive' });
} catch (e) {
  console.warn('mobile/ mirror upload skipped:', e?.message || e);
}

console.log('FIREBASE_APK_URL=' + firebaseApkUrl);
console.log('FIREBASE_GZ_URL=' + gzUrl);
console.log('APK_BYTES=' + apk.length);
console.log('GZ_BYTES=' + gz.length);

const writeRelease = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts/write-lead-agent-release.mjs'),
    '--firebase-apk-url',
    firebaseApkUrl,
    '--firebase-gz-url',
    gzUrl,
  ],
  { cwd: root, stdio: 'inherit' },
);
if (writeRelease.status !== 0) {
  process.exit(writeRelease.status ?? 1);
}

const publishManifest = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/publish-lead-agent-manifest-storage.mjs')],
  { cwd: root, stdio: 'inherit' },
);
if (publishManifest.status !== 0) {
  process.exit(publishManifest.status ?? 1);
}
