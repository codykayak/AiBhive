import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { getDiagnoseAuth, googleProvider } from '@/lib/firebase';
import { signInWithTeamCode as fieldSignInWithTeamCode, clearStoredFieldUid } from '@/lib/prosFieldAuth';
import type { TradePackId } from '@/lib/packs/types';

const PROFILE_KEY = 'aibhive.diagnose.profile.v1';

export type DiagnoseProfile = {
  displayName: string;
  photoUrl: string | null;
  tradePack?: TradePackId;
  /**
   * Opt-in to share field tips anonymously with other Diagnose users.
   * Default true — no names, customers, or addresses leave the device/shop.
   */
  shareAnonymously?: boolean;
};

type AuthContextValue = {
  user: User | null;
  profile: DiagnoseProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithTeamCode: (inviteCode: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (next: Partial<DiagnoseProfile>) => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readLocalProfile(): Promise<DiagnoseProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as DiagnoseProfile) : null;
  } catch {
    return null;
  }
}

async function writeLocalProfile(profile: DiagnoseProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DiagnoseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getDiagnoseAuth();
    if (!auth) {
      void readLocalProfile().then((local) => {
        setProfile(
          local
            ? { ...local, shareAnonymously: local.shareAnonymously !== false }
            : { displayName: 'Tech', photoUrl: null, tradePack: 'pool', shareAnonymously: true }
        );
        setLoading(false);
      });
      return;
    }

    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      const local = await readLocalProfile();
      if (next) {
        setProfile({
          displayName: local?.displayName || next.displayName || next.email?.split('@')[0] || 'Tech',
          photoUrl: local?.photoUrl || next.photoURL || null,
          tradePack: local?.tradePack || 'pool',
          shareAnonymously: local?.shareAnonymously !== false,
        });
      } else {
        setProfile(
          local
            ? { ...local, shareAnonymously: local.shareAnonymously !== false }
            : { displayName: 'Tech', photoUrl: null, tradePack: 'pool', shareAnonymously: true }
        );
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Keep Expo Go boot free of expo-auth-session (crashes without proper native OAuth setup).
    if (Platform.OS !== 'web') {
      const err = new Error(
        'Google sign-in on phone needs an EAS build with OAuth client IDs. For now use Account on the web preview, or ask your manager at aibhive.com/pros.'
      );
      (err as Error & { code?: string }).code = 'auth/native-pending';
      throw err;
    }
    const auth = getDiagnoseAuth();
    if (!auth) {
      throw new Error('Sign-in is unavailable offline. Open the web preview or try again later.');
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err instanceof Error && err.message?.trim()) throw err;
      const wrapped = new Error('Sign-in failed. Please try again.');
      const code = (err as { code?: string })?.code;
      if (code) (wrapped as Error & { code?: string }).code = code;
      throw wrapped;
    }
  }, []);

  const signInWithTeamCode = useCallback(async (inviteCode: string, displayName: string) => {
    const auth = getDiagnoseAuth();
    if (!auth) {
      throw new Error('Sign-in is unavailable offline. Connect and try again.');
    }
    await fieldSignInWithTeamCode(inviteCode, displayName);
    const local = await readLocalProfile();
    await writeLocalProfile({
      displayName: displayName.trim() || local?.displayName || 'Tech',
      photoUrl: local?.photoUrl ?? null,
      tradePack: local?.tradePack || 'pool',
      shareAnonymously: local?.shareAnonymously !== false,
    });
  }, []);

  const signOut = useCallback(async () => {
    const auth = getDiagnoseAuth();
    if (auth) await firebaseSignOut(auth);
    await clearStoredFieldUid();
  }, []);

  const saveProfile = useCallback(
    async (next: Partial<DiagnoseProfile>) => {
      const merged: DiagnoseProfile = {
        displayName: next.displayName ?? profile?.displayName ?? 'Tech',
        photoUrl: next.photoUrl !== undefined ? next.photoUrl : profile?.photoUrl ?? null,
        tradePack: next.tradePack ?? profile?.tradePack ?? 'pool',
        shareAnonymously:
          next.shareAnonymously !== undefined
            ? next.shareAnonymously
            : profile?.shareAnonymously !== false,
      };
      setProfile(merged);
      await writeLocalProfile(merged);
      const auth = getDiagnoseAuth();
      if (auth?.currentUser && merged.displayName) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: merged.displayName,
            photoURL: merged.photoUrl || undefined,
          });
        } catch {
          // non-fatal
        }
      }
    },
    [profile]
  );

  const getIdToken = useCallback(async () => {
    const auth = getDiagnoseAuth();
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithTeamCode,
      signOut,
      saveProfile,
      getIdToken,
    }),
    [user, profile, loading, signInWithGoogle, signInWithTeamCode, signOut, saveProfile, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
