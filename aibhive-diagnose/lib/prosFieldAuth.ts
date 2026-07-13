import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';

import { getDiagnoseAuth } from '@/lib/firebase';
import { joinProsCompany, parseProsApiError } from '@/lib/jobs/prosSync';

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

async function fetchProsMe(token: string): Promise<{
  membership?: { companyId?: string; role?: string } | null;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/pros/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Primary path: Firebase anonymous session + /api/pros/join (no custom OAuth). */
async function signInWithTeamCodeViaAnonymous(
  inviteCode: string,
  displayName: string
): Promise<FieldAuthResult> {
  const auth = getDiagnoseAuth();
  if (!auth) {
    throw new Error('Sign-in is unavailable. Check your connection and try again.');
  }

  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Anonymous sign-in is off in Firebase. Enable Authentication → Anonymous in Firebase Console, then try again.'
      );
    }
    throw new Error(
      err instanceof Error ? err.message : 'Could not start a field session. Check your connection.'
    );
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Anonymous sign-in failed — enable Anonymous auth in Firebase Console.');
  }

  const token = await user.getIdToken();
  const me = await fetchProsMe(token);
  if (me?.membership?.companyId) {
    await storeFieldUid(user.uid);
    return {
      companyId: me.membership.companyId,
      role: me.membership.role || 'tech',
      uid: user.uid,
    };
  }

  try {
    const joined = await joinProsCompany(token, inviteCode, displayName);
    await storeFieldUid(user.uid);
    return { companyId: joined.companyId, role: joined.role, uid: user.uid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already on a company roster/i.test(msg)) {
      await storeFieldUid(user.uid);
      const again = await fetchProsMe(token);
      return {
        companyId: again?.membership?.companyId || '',
        role: again?.membership?.role || 'tech',
        uid: user.uid,
      };
    }
    if (/invalid invite|invalid team/i.test(msg)) {
      throw new Error('Invalid team code — copy it from Pros HQ → Team tab.');
    }
    throw new Error(parseProsApiError(msg));
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

  const code = inviteCode.trim().toUpperCase();
  const name = displayName.trim();
  if (!code) throw new Error('Enter your shop team code (PROS-XXXXXX).');
  if (!name) throw new Error('Enter your name first.');

  const existingUid = await readStoredFieldUid();

  // Try custom-token re-login for returning field users.
  if (existingUid) {
    try {
      const res = await fetch(`${API_BASE}/api/pros/field-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code, displayName: name, existingUid }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.customToken && payload.uid) {
        await signInWithCustomToken(auth, payload.customToken);
        await storeFieldUid(payload.uid);
        return {
          companyId: payload.companyId || '',
          role: payload.role || 'tech',
          uid: payload.uid,
        };
      }
    } catch {
      /* fall through to anonymous join */
    }
  }

  // Default: anonymous Firebase + join (works when Admin createUser/custom token is blocked).
  return signInWithTeamCodeViaAnonymous(code, name);
}
