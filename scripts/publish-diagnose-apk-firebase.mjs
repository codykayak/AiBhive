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
const publicApkPath = path.join(root, 'public/aibhive-diagnose.apk');

if (!fs.existsSync(publicApkPath)) {
  console.error('No Diagnose APK found at public/aibhive-diagnose.apk');
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

const apk = fs.readFileSync(publicApkPath);
const gz = await gzip(apk);
await signInAnonymously(getAuth(app));

const sessionId = `diagnose-apk-${Date.now()}`;
const storage = getStorage(app);

const apkRef = ref(storage, 'mobile/aibhive-diagnose.apk');
await uploadBytes(apkRef, apk, { contentType: 'application/vnd.android.package-archive' });
const firebaseApkUrl = await getDownloadURL(apkRef);

const gzRef = ref(storage, `leads/${sessionId}/aibhive-diagnose.apk.gz`);
await uploadBytes(gzRef, gz, { contentType: 'application/gzip' });
const gzUrl = await getDownloadURL(gzRef);

console.log('FIREBASE_APK_URL=' + firebaseApkUrl);
console.log('FIREBASE_GZ_URL=' + gzUrl);
console.log('APK_BYTES=' + apk.length);
console.log('GZ_BYTES=' + gz.length);

const writeRelease = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts/write-diagnose-release.mjs'),
    '--firebase-apk-url',
    firebaseApkUrl,
    '--firebase-gz-url',
    gzUrl,
  ],
  { cwd: root, stdio: 'inherit' }
);
if (writeRelease.status !== 0) {
  process.exit(writeRelease.status ?? 1);
}
