import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0787280773",
  appId: "1:241519356033:web:a65cb593ca7ddc2d680580",
  apiKey: "AIzaSyAFAut5GHmLDDMM0HTFQ_Z_9qFUkZ6eBio",
  authDomain: "gen-lang-client-0787280773.firebaseapp.com",
  storageBucket: "gen-lang-client-0787280773.firebasestorage.app",
  messagingSenderId: "241519356033",
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
