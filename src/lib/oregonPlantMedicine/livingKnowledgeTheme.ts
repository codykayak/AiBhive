export type LivingKnowledgeTheme = 'dark' | 'light';

const STORAGE_KEY = 'living_knowledge_theme';

export function loadLivingKnowledgeTheme(): LivingKnowledgeTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveLivingKnowledgeTheme(theme: LivingKnowledgeTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
