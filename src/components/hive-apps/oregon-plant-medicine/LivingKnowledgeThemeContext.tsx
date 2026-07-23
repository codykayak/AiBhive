import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  loadLivingKnowledgeTheme,
  saveLivingKnowledgeTheme,
  type LivingKnowledgeTheme,
} from '../../../lib/oregonPlantMedicine/livingKnowledgeTheme';

type LivingKnowledgeThemeContextValue = {
  theme: LivingKnowledgeTheme;
  toggleTheme: () => void;
  setTheme: (theme: LivingKnowledgeTheme) => void;
};

const LivingKnowledgeThemeContext = createContext<LivingKnowledgeThemeContextValue | null>(null);

export function LivingKnowledgeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<LivingKnowledgeTheme>(() => loadLivingKnowledgeTheme());

  const setTheme = useCallback((next: LivingKnowledgeTheme) => {
    setThemeState(next);
    saveLivingKnowledgeTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-plants-app]');
    if (meta) meta.content = theme === 'light' ? '#ecfdf5' : '#059669';
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme],
  );

  return <LivingKnowledgeThemeContext.Provider value={value}>{children}</LivingKnowledgeThemeContext.Provider>;
}

export function useLivingKnowledgeTheme() {
  const ctx = useContext(LivingKnowledgeThemeContext);
  if (!ctx) {
    return {
      theme: 'dark' as LivingKnowledgeTheme,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
