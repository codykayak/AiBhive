import React, { createContext, useContext, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import type { User } from 'firebase/auth';
import { GOOGLE_AUTH_ENABLED } from '../constants/features';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const stubValue: AuthContextValue = {
  user: null,
  loading: false,
  signInWithGoogle: async () => {
    Alert.alert(
      'Sign in on the web app',
      'Google Sign-In is not configured in this APK build yet. Open Homework Bot in the browser to sign in with Google.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Homework Bot',
          onPress: () => void Linking.openURL('https://aibhive.com/hive-apps/run/example-homework-bot'),
        },
      ]
    );
  },
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Stub provider used when Google auth is disabled for sideload/APK builds. */
function AuthProviderStub({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => stubValue, []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_AUTH_ENABLED) {
    return <AuthProviderStub>{children}</AuthProviderStub>;
  }
  const { AuthProviderGoogle } = require('./AuthContext.google');
  return <AuthProviderGoogle>{children}</AuthProviderGoogle>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
