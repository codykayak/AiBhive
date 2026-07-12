import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { auth, googleProvider } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

const PROFILE_KEY = 'aibhive.diagnose.profile.v1';

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID ||
  '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

const HAS_NATIVE_GOOGLE_CLIENT = Boolean(
  GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID
);

export type DiagnoseProfile = {
  displayName: string;
  photoUrl: string | null;
  tradePack?: 'pool' | 'electrical' | 'property';
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

function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DiagnoseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
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
      if (auth.currentUser && merged.displayName) {
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
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  return { user, profile, loading, signOut, saveProfile, getIdToken };
}

async function signInWithGoogleWeb() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (err instanceof Error && err.message?.trim()) throw err;
    const wrapped = new Error('Sign-in failed. Please try again.');
    const code = (err as { code?: string })?.code;
    if (code) (wrapped as Error & { code?: string }).code = code;
    throw wrapped;
  }
}

/** Native Google OAuth only mounts when real client IDs exist — avoids Expo Go boot crashes. */
function AuthProviderNativeGoogle({ children }: { children: React.ReactNode }) {
  const base = useAuthState();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
  });

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      await signInWithGoogleWeb();
      return;
    }
    if (!request) {
      const err = new Error('Google sign-in is still loading. Try again in a moment.');
      (err as Error & { code?: string }).code = 'auth/request-pending';
      throw err;
    }
    const result = await promptAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') {
      const err = new Error('Sign-in was cancelled.');
      (err as Error & { code?: string }).code = 'auth/popup-closed-by-user';
      throw err;
    }
    if (result.type !== 'success') {
      throw new Error('Google sign-in failed. Please try again.');
    }
    const idToken =
      (result.params as { id_token?: string })?.id_token || result.authentication?.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check the OAuth client ID.');
    }
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }, [promptAsync, request]);

  const value = useMemo(
    () => ({ ...base, signInWithGoogle }),
    [base, signInWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AuthProviderBasic({ children }: { children: React.ReactNode }) {
  const base = useAuthState();

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      await signInWithGoogleWeb();
      return;
    }
    const err = new Error(
      'Google sign-in on phone needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Firebase OAuth web client). Until then, use the web preview Account tab or ask your manager at aibhive.com/pros.'
    );
    (err as Error & { code?: string }).code = 'auth/missing-client-id';
    throw err;
  }, []);

  const value = useMemo(
    () => ({ ...base, signInWithGoogle }),
    [base, signInWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Never mount the deprecated Google AuthSession hook without real client IDs —
  // it crashes Expo Go on launch ("Something went wrong").
  if (Platform.OS !== 'web' && HAS_NATIVE_GOOGLE_CLIENT) {
    return <AuthProviderNativeGoogle>{children}</AuthProviderNativeGoogle>;
  }
  return <AuthProviderBasic>{children}</AuthProviderBasic>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
