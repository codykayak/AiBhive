import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type AssistantDockMode = 'floating' | 'top';

export type AssistantFabVariant = 'ask' | 'customize';

type AssistantDockContextValue = {
  dockMode: AssistantDockMode;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  pinToTop: () => void;
  floatDock: () => void;
  topBarHeight: number;
  /** Single site-wide floating CTA — never stack Ask Bhive + Customize. */
  fabVariant: AssistantFabVariant;
  fabLabel: string;
  fabPrefill: string;
};

const AssistantDockContext = createContext<AssistantDockContextValue | null>(null);

const TOP_BAR_HEIGHT = 52;

const RESEARCH_LAB_PREFILL =
  'Customize Research Lab for me: add new research tools, tweak OCR and translation workflows, connect archive sources, and tailor the community library for my research goals.';

const TARTAR_PREFILL =
  'Customize Old Tartar Research for me: change anomaly detection rules, add new archive sources, adjust entity extraction, and tailor the research workflow.';

function inferDockMode(pathname: string): AssistantDockMode {
  if (
    pathname.includes('example-old-tartar-research') ||
    pathname.startsWith('/research-lab') ||
    pathname.startsWith('/old-world-research')
  ) {
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

function inferFab(pathname: string): { variant: AssistantFabVariant; label: string; prefill: string } {
  if (pathname.startsWith('/research-lab') || pathname.startsWith('/old-world-research')) {
    return {
      variant: 'customize',
      label: 'Customize this app',
      prefill: RESEARCH_LAB_PREFILL,
    };
  }
  if (pathname.includes('example-old-tartar-research')) {
    return {
      variant: 'customize',
      label: 'Customize this app',
      prefill: TARTAR_PREFILL,
    };
  }
  return {
    variant: 'ask',
    label: 'Ask Bhive',
    prefill: '',
  };
}

export function AssistantDockProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const autoMode = inferDockMode(pathname);
  const fab = inferFab(pathname);
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
      fabVariant: fab.variant,
      fabLabel: fab.label,
      fabPrefill: fab.prefill,
    }),
    [dockMode, expanded, pinToTop, floatDock, fab.variant, fab.label, fab.prefill],
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
      fabVariant: 'ask' as AssistantFabVariant,
      fabLabel: 'Ask Bhive',
      fabPrefill: '',
    };
  }
  return ctx;
}

export { TOP_BAR_HEIGHT };
