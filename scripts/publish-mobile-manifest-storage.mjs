#!/usr/bin/env node
/** Upload public/mobile-releases.json to Firebase Storage (public read). */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const manifestPath = 'public/mobile-releases.json';
if (!fs.existsSync(manifestPath)) {
  console.error('Missing', manifestPath);
  process.exit(1);
}

const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  appId: config.appId,
  messagingSenderId: config.messagingSenderId,
});

await signInAnonymously(getAuth(app));
const storage = getStorage(app);
const manifestRef = ref(storage, 'mobile/mobile-releases.json');
await uploadBytes(manifestRef, fs.readFileSync(manifestPath), { contentType: 'application/json' });
const manifestUrl = await getDownloadURL(manifestRef);
console.log('FIREBASE_MANIFEST_URL=' + manifestUrl);
