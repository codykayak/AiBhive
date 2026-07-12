import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAFAut5GHmLDDMM0HTFQ_Z_9qFUkZ6eBio',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0787280773.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0787280773',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'gen-lang-client-0787280773.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '241519356033',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:241519356033:web:a65cb593ca7ddc2d680580',
};

function getOrCreateApp(): FirebaseApp {
  return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
}

/** Lazy auth — never throw during module load (kills Expo Go instantly). */
function createAuth(): Auth | null {
  try {
    return getAuth(getOrCreateApp());
  } catch (err) {
    console.warn('[firebase] auth init failed — continuing offline-only', err);
    return null;
  }
}

let authInstance: Auth | null | undefined;

export function getDiagnoseAuth(): Auth | null {
  if (authInstance === undefined) {
    authInstance = createAuth();
  }
  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();
