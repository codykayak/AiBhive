import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type AssistantDockMode = 'floating' | 'top';

type AssistantDockContextValue = {
  dockMode: AssistantDockMode;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  pinToTop: () => void;
  floatDock: () => void;
  topBarHeight: number;
};

const AssistantDockContext = createContext<AssistantDockContextValue | null>(null);

const TOP_BAR_HEIGHT = 52;

function inferDockMode(pathname: string): AssistantDockMode {
  if (pathname.includes('example-old-tartar-research')) {
    return 'floating';
  }
  if (
    pathname.startsWith('/hive-apps/run') ||
    pathname.startsWith('/hive-apps/build') ||
    pathname.startsWith('/app/research')
  ) {
    return 'top';
  }
  return 'floating';
}

export function AssistantDockProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const autoMode = inferDockMode(pathname);
  const [overrideMode, setOverrideMode] = useState<AssistantDockMode | null>(null);
  const [expanded, setExpanded] = useState(false);

  const dockMode = overrideMode ?? autoMode;

  const pinToTop = useCallback(() => setOverrideMode('top'), []);
  const floatDock = useCallback(() => setOverrideMode('floating'), []);

  const value = useMemo(
    () => ({
      dockMode,
      expanded,
      setExpanded,
      pinToTop,
      floatDock,
      topBarHeight: dockMode === 'top' ? TOP_BAR_HEIGHT : 0,
    }),
    [dockMode, expanded, pinToTop, floatDock]
  );

  return <AssistantDockContext.Provider value={value}>{children}</AssistantDockContext.Provider>;
}

export function useAssistantDock() {
  const ctx = useContext(AssistantDockContext);
  if (!ctx) {
    return {
      dockMode: 'floating' as AssistantDockMode,
      expanded: false,
      setExpanded: () => {},
      pinToTop: () => {},
      floatDock: () => {},
      topBarHeight: 0,
    };
  }
  return ctx;
}

export { TOP_BAR_HEIGHT };
