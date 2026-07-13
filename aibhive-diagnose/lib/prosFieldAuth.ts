import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';

import { getDiagnoseAuth } from '@/lib/firebase';
import { joinProsCompany } from '@/lib/jobs/prosSync';

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

/** Fallback: Firebase anonymous session + existing /api/pros/join (no Admin createUser). */
async function signInWithTeamCodeViaAnonymous(
  inviteCode: string,
  displayName: string
): Promise<FieldAuthResult> {
  const auth = getDiagnoseAuth();
  if (!auth) {
    throw new Error('Sign-in is unavailable. Check your connection and try again.');
  }
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Anonymous sign-in failed — enable Anonymous auth in Firebase Console.');

  const token = await user.getIdToken();
  try {
    const joined = await joinProsCompany(token, inviteCode, displayName);
    await storeFieldUid(user.uid);
    return { companyId: joined.companyId, role: joined.role, uid: user.uid };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes('Already on a company roster')) {
      await storeFieldUid(user.uid);
      return { companyId: '', role: 'tech', uid: user.uid };
    }
    throw new Error(raw.includes('Invalid invite') ? 'Invalid team code' : raw);
  }
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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/pros/field-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode: inviteCode.trim().toUpperCase(),
        displayName: displayName.trim(),
        existingUid: existingUid || undefined,
      }),
    });
  } catch {
    return signInWithTeamCodeViaAnonymous(inviteCode, displayName);
  }

  let payload: { error?: string; customToken?: string; companyId?: string; role?: string; uid?: string } =
    {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  if (!res.ok || !payload.customToken || !payload.uid) {
    const serverMsg = payload.error || '';
    if (res.status >= 500 || serverMsg.toLowerCase().includes('field sign-in failed')) {
      return signInWithTeamCodeViaAnonymous(inviteCode, displayName);
    }
    throw new Error(serverMsg || `Could not sign in (${res.status}). Check the team code.`);
  }

  try {
    await signInWithCustomToken(auth, payload.customToken);
  } catch (err) {
    return signInWithTeamCodeViaAnonymous(inviteCode, displayName);
  }
  await storeFieldUid(payload.uid);

  return {
    companyId: payload.companyId || '',
    role: payload.role || 'tech',
    uid: payload.uid,
  };
}
