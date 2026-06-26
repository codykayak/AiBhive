import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';
import { spawnSync } from 'child_process';

const gzip = promisify(zlib.gzip);

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  appId: config.appId,
  messagingSenderId: config.messagingSenderId,
});

const builtApkPath = 'taylored-mobile/android/app/build/outputs/apk/release/app-release.apk';
const publicApkPath = 'public/taylored-mobile.apk';

if (fs.existsSync(builtApkPath)) {
  const builtStat = fs.statSync(builtApkPath);
  const publicStat = fs.existsSync(publicApkPath) ? fs.statSync(publicApkPath) : null;
  const shouldSync =
    !publicStat ||
    builtStat.mtimeMs > publicStat.mtimeMs ||
    builtStat.size !== publicStat.size;
  if (shouldSync) {
    fs.copyFileSync(builtApkPath, publicApkPath);
    console.log('Synced fresh Gradle APK → public/taylored-mobile.apk');
  }
}

const apkPath = publicApkPath;
if (!fs.existsSync(apkPath)) {
  console.error('APK not found. Run taylored-mobile/scripts/ci-android-build.sh first.');
  process.exit(1);
}

const apk = fs.readFileSync(apkPath);
const gz = await gzip(apk);
await signInAnonymously(getAuth(app));

const sessionId = `mobile-apk-${Date.now()}`;
const storage = getStorage(app);

const apkRef = ref(storage, 'mobile/taylored-mobile.apk');
await uploadBytes(apkRef, apk, { contentType: 'application/vnd.android.package-archive' });
const firebaseApkUrl = await getDownloadURL(apkRef);

const gzRef = ref(storage, `leads/${sessionId}/taylored-mobile.apk.gz`);
await uploadBytes(gzRef, gz, { contentType: 'application/gzip' });
const gzUrl = await getDownloadURL(gzRef);

console.log('FIREBASE_APK_URL=' + firebaseApkUrl);
console.log('FIREBASE_GZ_URL=' + gzUrl);
console.log('APK_BYTES=' + apk.length);
console.log('GZ_BYTES=' + gz.length);

const writeRelease = spawnSync(
  process.execPath,
  [
    'scripts/write-mobile-release.mjs',
    '--firebase-apk-url',
    firebaseApkUrl,
    '--firebase-gz-url',
    gzUrl,
  ],
  { cwd: process.cwd(), stdio: 'inherit' }
);
if (writeRelease.status !== 0) {
  process.exit(writeRelease.status ?? 1);
}
