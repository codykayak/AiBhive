import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';

import { API_BASE } from '@/lib/config/apiBase';
import { getDiagnoseAuth } from '@/lib/firebase';
import { joinProsCompany, parseProsApiError } from '@/lib/jobs/prosSync';

const FIELD_UID_KEY = 'aibhive.pros.fieldUid.v1';
const FIELD_INVITE_KEY = 'aibhive.pros.fieldInviteCode.v1';
const FIELD_NAME_KEY = 'aibhive.pros.fieldDisplayName.v1';

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

export async function readStoredFieldInviteCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FIELD_INVITE_KEY);
  } catch {
    return null;
  }
}

async function readStoredFieldDisplayName(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FIELD_NAME_KEY);
  } catch {
    return null;
  }
}

async function storeFieldCredentials(uid: string, inviteCode: string, displayName: string) {
  await AsyncStorage.multiSet([
    [FIELD_UID_KEY, uid],
    [FIELD_INVITE_KEY, inviteCode.trim().toUpperCase()],
    [FIELD_NAME_KEY, displayName.trim().slice(0, 80) || 'Tech'],
  ]);
}

export async function clearStoredFieldUid() {
  await clearStoredFieldCredentials();
}

export async function clearStoredFieldCredentials() {
  await AsyncStorage.multiRemove([FIELD_UID_KEY, FIELD_INVITE_KEY, FIELD_NAME_KEY]);
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

async function signInWithFieldAuthToken(
  inviteCode: string,
  displayName: string,
  existingUid: string
): Promise<FieldAuthResult | null> {
  const auth = getDiagnoseAuth();
  if (!auth) return null;

  const res = await fetch(`${API_BASE}/api/pros/field-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode, displayName, existingUid }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.customToken || !payload.uid) {
    return null;
  }

  await signInWithCustomToken(auth, payload.customToken);
  await storeFieldCredentials(payload.uid, inviteCode, displayName);
  return {
    companyId: payload.companyId || '',
    role: payload.role || 'tech',
    uid: payload.uid,
  };
}

/**
 * Restore a field tech session on cold start using stored team code + UID.
 * Keeps techs signed in until the employer revokes membership or they sign out.
 */
export async function restoreProsFieldSession(): Promise<FieldAuthResult | null> {
  const auth = getDiagnoseAuth();
  if (!auth) return null;

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      const me = await fetchProsMe(token);
      if (me?.membership?.companyId) {
        const inviteCode = (await readStoredFieldInviteCode()) || '';
        const displayName =
          (await readStoredFieldDisplayName()) || auth.currentUser.displayName || 'Tech';
        if (inviteCode) {
          await storeFieldCredentials(auth.currentUser.uid, inviteCode, displayName);
        }
        return {
          companyId: me.membership.companyId,
          role: me.membership.role || 'tech',
          uid: auth.currentUser.uid,
        };
      }
    } catch {
      // continue to custom-token restore
    }
  }

  const existingUid = await readStoredFieldUid();
  const inviteCode = await readStoredFieldInviteCode();
  const displayName = (await readStoredFieldDisplayName()) || 'Tech';
  if (!existingUid || !inviteCode) return null;

  try {
    return await signInWithFieldAuthToken(inviteCode, displayName, existingUid);
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
    await storeFieldCredentials(user.uid, inviteCode, displayName);
    return {
      companyId: me.membership.companyId,
      role: me.membership.role || 'tech',
      uid: user.uid,
    };
  }

  try {
    const joined = await joinProsCompany(token, inviteCode, displayName);
    await storeFieldCredentials(user.uid, inviteCode, displayName);
    return { companyId: joined.companyId, role: joined.role, uid: user.uid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already on a company roster/i.test(msg)) {
      await storeFieldCredentials(user.uid, inviteCode, displayName);
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

  if (existingUid) {
    try {
      const restored = await signInWithFieldAuthToken(code, name, existingUid);
      if (restored) return restored;
    } catch {
      /* fall through to anonymous join */
    }
  }

  return signInWithTeamCodeViaAnonymous(code, name);
}
