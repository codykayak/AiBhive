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
    let cancelled = false;

    // Dynamic import keeps NetInfo off the critical boot path. A static import can
    // throw during module init on SDK-mismatched Expo Go builds.
    void import('@react-native-community/netinfo')
      .then((NetInfo) => {
        if (cancelled) return;
        try {
          unsubscribe = NetInfo.default.addEventListener((state) => {
            setIsOnline(Boolean(state.isConnected));
            setIsInternetReachable(state.isInternetReachable);
          });
        } catch {
          setIsOnline(true);
          setIsInternetReachable(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsOnline(true);
          setIsInternetReachable(true);
        }
      });

    return () => {
      cancelled = true;
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
