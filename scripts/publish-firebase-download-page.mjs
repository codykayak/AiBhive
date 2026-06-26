#!/usr/bin/env node
/** Upload public/download.html to Firebase Storage (public read) for direct mobile access. */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const htmlPath = 'public/download.html';
if (!fs.existsSync(htmlPath)) {
  console.error('Missing', htmlPath);
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
const pageRef = ref(storage, 'mobile/download.html');
await uploadBytes(pageRef, fs.readFileSync(htmlPath), { contentType: 'text/html; charset=utf-8' });
const pageUrl = await getDownloadURL(pageRef);
console.log('FIREBASE_DOWNLOAD_PAGE_URL=' + pageUrl);
