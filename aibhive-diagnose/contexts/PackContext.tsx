import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { TRADE_PACKS, getTradePack, type TradePack, type TradePackId } from '@/lib/packs';

const STORAGE_KEY = 'aibhive.diagnose.activePack';

type PackContextValue = {
  activePackId: TradePackId;
  activePack: TradePack;
  setActivePackId: (id: TradePackId) => void;
  packs: TradePack[];
};

const PackContext = createContext<PackContextValue | null>(null);

export function PackProvider({ children }: { children: React.ReactNode }) {
  const [activePackId, setActivePackIdState] = useState<TradePackId>('pool');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'pool' || stored === 'electrical')) {
          setActivePackIdState(stored);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setActivePackId = useCallback((id: TradePackId) => {
    setActivePackIdState(id);
    void AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo<PackContextValue>(
    () => ({
      activePackId,
      activePack: getTradePack(activePackId),
      setActivePackId,
      packs: Object.values(TRADE_PACKS),
    }),
    [activePackId, setActivePackId]
  );

  if (!hydrated) {
    return null;
  }

  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

export function usePack() {
  const ctx = useContext(PackContext);
  if (!ctx) {
    throw new Error('usePack must be used within PackProvider');
  }
  return ctx;
}
