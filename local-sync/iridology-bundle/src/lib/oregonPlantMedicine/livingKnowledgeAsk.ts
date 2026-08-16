import type { LivingKnowledgeScope } from './livingKnowledgeRag';

export const LIVING_KNOWLEDGE_OPEN_ASK_EVENT = 'living-knowledge:open-ask';

export function livingKnowledgeScopeForTab(tab: string): LivingKnowledgeScope {
  switch (tab) {
    case 'plants':
      return 'plants';
    case 'holistic':
      return 'holistic';
    case 'hypnosis':
      return 'hypnosis';
    case 'animal-health':
      return 'animal-health';
    case 'herbs':
      return 'herbs';
    case 'supplements':
      return 'supplements';
    case 'iridology':
      return 'iridology';
    default:
      return 'all';
  }
}

/** Scroll to the on-page Living Knowledge agent, or request a fallback drawer. */
export function openLivingKnowledgeAsk() {
  if (typeof window === 'undefined') return;
  const inline = document.querySelector('[data-lk-ask-agent]');
  if (inline) {
    inline.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.dispatchEvent(
      new CustomEvent(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, { detail: { focus: true, fallback: false } }),
    );
    return;
  }
  window.dispatchEvent(
    new CustomEvent(LIVING_KNOWLEDGE_OPEN_ASK_EVENT, { detail: { focus: true, fallback: true } }),
  );
}
