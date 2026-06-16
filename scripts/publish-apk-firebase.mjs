import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';

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

const apkPath = 'public/taylored-mobile.apk';
if (!fs.existsSync(apkPath)) {
  console.error('APK not found at', apkPath);
  process.exit(1);
}

const apk = fs.readFileSync(apkPath);
const gz = await gzip(apk);
await signInAnonymously(getAuth(app));

const sessionId = `mobile-apk-${Date.now()}`;
const storage = getStorage(app);

const gzRef = ref(storage, `leads/${sessionId}/taylored-mobile.apk.gz`);
await uploadBytes(gzRef, gz, { contentType: 'application/gzip' });
const gzUrl = await getDownloadURL(gzRef);

console.log('FIREBASE_GZ_URL=' + gzUrl);
console.log('APK_BYTES=' + apk.length);
console.log('GZ_BYTES=' + gz.length);
