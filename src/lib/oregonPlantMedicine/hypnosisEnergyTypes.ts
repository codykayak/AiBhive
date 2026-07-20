import type { ResearchTopicBase } from './topicLibraryTypes';

export type HypnosisEnergyCategory =
  | 'hypnotherapy'
  | 'regression'
  | 'traditions'
  | 'reiki-chakra'
  | 'sound-frequency'
  | 'legal-safety';

export type HypnosisEnergyTopic = ResearchTopicBase & {
  category: HypnosisEnergyCategory;
};

export const HYPNOSIS_ENERGY_CATEGORY_LABELS: Record<HypnosisEnergyCategory, string> = {
  hypnotherapy: 'Clinical & modern hypnotherapy',
  regression: 'Regression & subconscious work',
  traditions: 'Cayce, Cannon & traditions',
  'reiki-chakra': 'Reiki & chakra energy',
  'sound-frequency': 'Sound, bowls & frequencies',
  'legal-safety': 'Legal & safety',
};
