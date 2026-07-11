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

import { auth, googleProvider } from '@/lib/firebase';

const PROFILE_KEY = 'aibhive.diagnose.profile.v1';

export type DiagnoseProfile = {
  displayName: string;
  photoUrl: string | null;
  tradePack?: 'pool' | 'electrical' | 'property';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
        });
      } else {
        setProfile(local);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Google sign-in is available on web preview; native EAS build comes next.');
    }
    await signInWithPopup(auth, googleProvider);
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

  const value = useMemo(
    () => ({ user, profile, loading, signInWithGoogle, signOut, saveProfile, getIdToken }),
    [user, profile, loading, signInWithGoogle, signOut, saveProfile, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
