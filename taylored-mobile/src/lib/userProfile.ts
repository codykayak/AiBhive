import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

export type UserProfile = {
  uid: string;
  candidateName: string;
  email: string;
  phone: string;
  history: string;
  resumeUri?: string;
  resumeDownloadUrl?: string;
  updatedAt?: string;
};

const emptyProfile = (uid: string): UserProfile => ({
  uid,
  candidateName: '',
  email: '',
  phone: '',
  history: '',
});

function profileRef(uid: string) {
  return doc(db, 'user_profiles', uid);
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(profileRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      candidateName: data.candidateName || '',
      email: data.email || '',
      phone: data.phone || '',
      history: data.history || '',
      resumeUri: data.resumeUri,
      resumeDownloadUrl: data.resumeDownloadUrl,
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const existing = (await loadUserProfile(uid)) || emptyProfile(uid);
  const merged: UserProfile = {
    ...existing,
    ...profile,
    uid,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(
    profileRef(uid),
    {
      candidateName: merged.candidateName,
      email: merged.email,
      phone: merged.phone,
      history: merged.history,
      resumeUri: merged.resumeUri || null,
      resumeDownloadUrl: merged.resumeDownloadUrl || null,
      updatedAt: merged.updatedAt,
      syncedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return merged;
}

/** Upload resume to Firebase Storage; returns download URL. */
export async function uploadResumeToCloud(uid: string, localUri: string): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const path = `user-resumes/${uid}/resume-${Date.now()}.pdf`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}

export async function syncProfileFromCloud(uid: string): Promise<UserProfile | null> {
  return loadUserProfile(uid);
}

export async function syncProfileToCloud(uid: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  let patch = { ...profile };
  if (profile.resumeUri && !profile.resumeDownloadUrl) {
    const url = await uploadResumeToCloud(uid, profile.resumeUri);
    if (url) patch = { ...patch, resumeDownloadUrl: url };
  }
  return saveUserProfile(uid, patch);
}
