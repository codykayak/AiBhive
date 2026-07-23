import type { ResearchTopicBase } from './topicLibraryTypes';

export type SupplementsCategory =
  | 'vitamins'
  | 'minerals'
  | 'amino-performance'
  | 'omegas-fats'
  | 'gut-immune'
  | 'specialty-compounds'
  | 'quality-safety';

export type SupplementsTopic = ResearchTopicBase & {
  category: SupplementsCategory;
};

export const SUPPLEMENTS_CATEGORY_LABELS: Record<SupplementsCategory, string> = {
  vitamins: 'Vitamins',
  minerals: 'Minerals & electrolytes',
  'amino-performance': 'Amino acids & performance',
  'omegas-fats': 'Omegas & healthy fats',
  'gut-immune': 'Gut & immune support',
  'specialty-compounds': 'Specialty compounds',
  'quality-safety': 'Quality, dosing & safety',
};
