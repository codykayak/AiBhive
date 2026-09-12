import type { ResearchTopicBase } from './topicLibraryTypes';

export type AutoimmuneCategory =
  | 'conditions'
  | 'gut-terrain'
  | 'mitochondria-light'
  | 'environment-emf'
  | 'international-traditions'
  | 'diet-protocols'
  | 'nervous-system'
  | 'plant-allies'
  | 'research-context';

export type AutoimmuneTopic = ResearchTopicBase & {
  category: AutoimmuneCategory;
};

export const AUTOIMMUNE_CATEGORY_LABELS: Record<AutoimmuneCategory, string> = {
  conditions: 'Autoimmune conditions',
  'gut-terrain': 'Gut & immune terrain',
  'mitochondria-light': 'Mitochondria, light & circadian biology',
  'environment-emf': 'Environment, EMF & toxins',
  'international-traditions': 'Global healing traditions',
  'diet-protocols': 'Diet & elimination protocols',
  'nervous-system': 'Nervous system & stress',
  'plant-allies': 'Herbs & plant allies',
  'research-context': 'Research gaps & remission stories',
};
