// Firebase Configuration for Taylored Mobile
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/** Fallbacks from repo firebase-applet-config.json — overridden by EXPO_PUBLIC_* at build time. */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAFAut5GHmLDDMM0HTFQ_Z_9qFUkZ6eBio',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0787280773.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0787280773',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'gen-lang-client-0787280773.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '241519356033',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:241519356033:web:a65cb593ca7ddc2d680580',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app, 'ai-studio-096b2204-b995-4572-bba4-45d4d32944cd');
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
