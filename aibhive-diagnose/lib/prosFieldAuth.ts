import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCustomToken } from 'firebase/auth';

import { getDiagnoseAuth } from '@/lib/firebase';

const FIELD_UID_KEY = 'aibhive.pros.fieldUid.v1';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://aibhive.com';

export type FieldAuthResult = {
  companyId: string;
  role: string;
  uid: string;
};

export async function readStoredFieldUid(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FIELD_UID_KEY);
  } catch {
    return null;
  }
}

async function storeFieldUid(uid: string) {
  await AsyncStorage.setItem(FIELD_UID_KEY, uid);
}

export async function clearStoredFieldUid() {
  await AsyncStorage.removeItem(FIELD_UID_KEY);
}

/** Sign in with shop team code — no Google OAuth required. */
export async function signInWithTeamCode(
  inviteCode: string,
  displayName: string
): Promise<FieldAuthResult> {
  const auth = getDiagnoseAuth();
  if (!auth) {
    throw new Error('Sign-in is unavailable. Check your connection and try again.');
  }

  const existingUid = await readStoredFieldUid();
  const res = await fetch(`${API_BASE}/api/pros/field-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inviteCode: inviteCode.trim().toUpperCase(),
      displayName: displayName.trim(),
      existingUid: existingUid || undefined,
    }),
  });

  let payload: { error?: string; customToken?: string; companyId?: string; role?: string; uid?: string } =
    {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  if (!res.ok || !payload.customToken || !payload.uid) {
    throw new Error(payload.error || 'Could not sign in with that team code.');
  }

  await signInWithCustomToken(auth, payload.customToken);
  await storeFieldUid(payload.uid);

  return {
    companyId: payload.companyId || '',
    role: payload.role || 'tech',
    uid: payload.uid,
  };
}
