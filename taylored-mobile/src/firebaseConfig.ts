import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0787280773",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:241519356033:web:a65cb593ca7ddc2d680580",
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAFAut5GHmLDDMM0HTFQ_Z_9qFUkZ6eBio",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0787280773.firebaseapp.com",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0787280773.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "241519356033",
  measurementId: ""
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
