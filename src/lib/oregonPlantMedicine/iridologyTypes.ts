import type { ResearchTopicBase } from './topicLibraryTypes';

export type IridologyMethodology = 'integrated' | 'jensen' | 'physical' | 'all';

export type IridologyCategory =
  | 'methodology'
  | 'zone-chart'
  | 'constitutional'
  | 'signs-fibers'
  | 'photo-guide'
  | 'safety';

export type IridologyTopic = ResearchTopicBase & {
  category: IridologyCategory;
};

export const IRIDOLOGY_CATEGORY_LABELS: Record<IridologyCategory, string> = {
  methodology: 'Methodologies',
  'zone-chart': 'Zone charts',
  constitutional: 'Constitutional types',
  'signs-fibers': 'Signs & fiber patterns',
  'photo-guide': 'Photo capture guide',
  safety: 'Safety & limits',
};

export const IRIDOLOGY_METHODOLOGY_LABELS: Record<IridologyMethodology, string> = {
  integrated: 'Integrated (recommended)',
  jensen: 'Jensen zone chart',
  physical: 'Physical / European',
  all: 'All schools (compare)',
};
