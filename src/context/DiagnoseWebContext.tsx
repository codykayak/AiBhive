import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { WEB_TRADE_PACKS, WEB_TRADE_PACK_LIST, getWebTradePack } from '../../aibhive-diagnose/lib/packs/webPacks';
import type { TradePack, TradePackId } from '../../aibhive-diagnose/lib/packs/types';
import { fetchDiagnoseAccount, loadActivePackId, saveActivePackId } from '../lib/diagnoseWeb/api';
import type { DiagnoseWebAccount } from '../lib/diagnoseWeb/types';

type DiagnoseWebContextValue = {
  user: User | null;
  authReady: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  idToken: string | null;
  account: DiagnoseWebAccount | null;
  refreshAccount: () => Promise<void>;
  activePack: TradePack;
  setActivePackId: (id: TradePackId) => void;
  creditsDepletedOpen: boolean;
  setCreditsDepletedOpen: (open: boolean) => void;
};

const DiagnoseWebContext = createContext<DiagnoseWebContextValue | null>(null);

export function DiagnoseWebProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [account, setAccount] = useState<DiagnoseWebAccount | null>(null);
  const [packId, setPackId] = useState<TradePackId>(() => loadActivePackId());
  const [creditsDepletedOpen, setCreditsDepletedOpen] = useState(false);

  const activePack = WEB_TRADE_PACKS[packId];

  const refreshAccount = useCallback(async () => {
    if (!user) {
      setAccount(null);
      return;
    }
    const token = await user.getIdToken();
    setIdToken(token);
    const acct = await fetchDiagnoseAccount(token);
    setAccount(acct);
  }, [user]);

  useEffect(() => {
    void getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setIdToken(null);
      setAccount(null);
      return;
    }
    void refreshAccount();
  }, [user, refreshAccount]);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw err;
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setAccount(null);
    setIdToken(null);
  }, []);

  const setActivePackId = useCallback((id: TradePackId) => {
    setPackId(id);
    saveActivePackId(id);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authReady,
      signIn,
      signOutUser,
      idToken,
      account,
      refreshAccount,
      activePack,
      setActivePackId,
      creditsDepletedOpen,
      setCreditsDepletedOpen,
    }),
    [
      user,
      authReady,
      signIn,
      signOutUser,
      idToken,
      account,
      refreshAccount,
      activePack,
      setActivePackId,
      creditsDepletedOpen,
    ]
  );

  return <DiagnoseWebContext.Provider value={value}>{children}</DiagnoseWebContext.Provider>;
}

export function useDiagnoseWeb() {
  const ctx = useContext(DiagnoseWebContext);
  if (!ctx) throw new Error('useDiagnoseWeb must be used within DiagnoseWebProvider');
  return ctx;
}

export { getWebTradePack, WEB_TRADE_PACK_LIST, WEB_TRADE_PACKS };
