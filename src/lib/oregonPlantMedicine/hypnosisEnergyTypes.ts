import type { ExternalLink } from './types';

export type HypnosisEnergyCategory =
  | 'hypnotherapy'
  | 'regression'
  | 'traditions'
  | 'reiki-chakra'
  | 'sound-frequency'
  | 'legal-safety';

export type HypnosisEnergyTopic = {
  id: string;
  title: string;
  category: HypnosisEnergyCategory;
  summary: string;
  /** Educational framing — not a diagnosis or treatment plan */
  whenPeopleExplore: string;
  approaches: string[];
  relatedPlantIds: string[];
  safetyWarnings: string[];
  sources: ExternalLink[];
};

export const HYPNOSIS_ENERGY_CATEGORY_LABELS: Record<HypnosisEnergyCategory, string> = {
  hypnotherapy: 'Clinical & modern hypnotherapy',
  regression: 'Regression & subconscious work',
  traditions: 'Cayce, Cannon & traditions',
  'reiki-chakra': 'Reiki & chakra energy',
  'sound-frequency': 'Sound, bowls & frequencies',
  'legal-safety': 'Legal & safety',
};
