import React, { createContext, useContext, useMemo } from 'react';
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
  signInWithGoogle: async () => {},
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
