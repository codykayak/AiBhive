import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type NetworkContextValue = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  isInternetReachable: true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(Boolean(state.isConnected));
        setIsInternetReachable(state.isInternetReachable);
      });
    } catch {
      // Wrong Expo Go SDK / missing native module — stay online so the app still boots.
      setIsOnline(true);
      setIsInternetReachable(true);
    }
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      isInternetReachable,
    }),
    [isOnline, isInternetReachable]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
