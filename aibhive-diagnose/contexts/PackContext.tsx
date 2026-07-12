import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { TRADE_PACKS, getTradePack, type TradePack, type TradePackId } from '@/lib/packs';

const STORAGE_KEY = 'aibhive.diagnose.activePack';

type PackContextValue = {
  activePackId: TradePackId;
  activePack: TradePack;
  setActivePackId: (id: TradePackId) => void;
  packs: TradePack[];
};

const PackContext = createContext<PackContextValue | null>(null);

function isPackId(value: unknown): value is TradePackId {
  return (
    value === 'pool' ||
    value === 'electrical' ||
    value === 'property' ||
    value === 'plumbing' ||
    value === 'hvac'
  );
}

export function PackProvider({ children }: { children: React.ReactNode }) {
  const { profile, saveProfile } = useAuth();
  const [activePackId, setActivePackIdState] = useState<TradePackId>('pool');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && isPackId(stored)) {
          setActivePackIdState(stored);
        } else if (!cancelled && isPackId(profile?.tradePack)) {
          setActivePackIdState(profile.tradePack);
        }
      } catch {
        // Keep default pack if storage is unavailable.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.tradePack]);

  // When profile trade pack arrives after hydrate and storage was empty, adopt it once.
  useEffect(() => {
    if (!hydrated) return;
    if (!isPackId(profile?.tradePack)) return;
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored && profile?.tradePack) {
        setActivePackIdState(profile.tradePack);
      }
    })();
  }, [hydrated, profile?.tradePack]);

  const setActivePackId = useCallback(
    (id: TradePackId) => {
      setActivePackIdState(id);
      void AsyncStorage.setItem(STORAGE_KEY, id);
      if (profile?.tradePack !== id) {
        void saveProfile({ tradePack: id });
      }
    },
    [profile?.tradePack, saveProfile]
  );

  const value = useMemo<PackContextValue>(
    () => ({
      activePackId,
      activePack: getTradePack(activePackId),
      setActivePackId,
      packs: Object.values(TRADE_PACKS),
    }),
    [activePackId, setActivePackId]
  );

  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

export function usePack() {
  const ctx = useContext(PackContext);
  if (!ctx) {
    throw new Error('usePack must be used within PackProvider');
  }
  return ctx;
}
