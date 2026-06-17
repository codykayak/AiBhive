import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../firebaseConfig';
import { registerHiveUserWithAuth } from '../lib/hiveApi';
import { syncProfileFromCloud } from '../lib/userProfile';
import { syncJobsFromCloud } from '../lib/jobSync';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '241519356033-PLACEHOLDER.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function AuthProviderGoogle({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      setLoading(false);
      if (next) {
        try {
          const token = await next.getIdToken();
          await registerHiveUserWithAuth(next.uid, token, next.email || undefined);
          await syncProfileFromCloud(next.uid);
          await syncJobsFromCloud(next.uid);
        } catch (err) {
          console.warn('[auth] post-login sync failed', err);
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (!idToken) {
      Alert.alert('Sign-in failed', 'Google did not return a valid token.');
      return;
    }
    void (async () => {
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not sign in';
        Alert.alert('Sign-in failed', msg);
      }
    })();
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (!request) {
      Alert.alert(
        'Google Sign-In',
        Platform.OS === 'android'
          ? 'Google Sign-In is initializing. If this persists, add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your build.'
          : 'Google Sign-In is not ready yet.'
      );
      return;
    }
    await promptAsync();
  }, [promptAsync, request]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthGoogle() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
