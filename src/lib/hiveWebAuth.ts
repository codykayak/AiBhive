import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '../firebase';

/** Ensure a Firebase user exists for Hive store install/build flows. */
export async function ensureHiveWebUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function getHiveWebAuthHeaders(): Promise<{
  userId: string;
  idToken: string;
}> {
  const user = await ensureHiveWebUser();
  const idToken = await user.getIdToken();
  return { userId: user.uid, idToken };
}

export function watchHiveWebUser(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}
