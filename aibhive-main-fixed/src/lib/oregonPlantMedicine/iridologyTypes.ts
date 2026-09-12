import type { ResearchTopicBase } from './topicLibraryTypes';

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
  methodology: 'Methodology',
  'zone-chart': 'Zone charts',
  constitutional: 'Constitutional typing',
  'signs-fibers': 'Physical signs & fibers',
  'photo-guide': 'Photo capture',
  safety: 'Eye emergencies',
};

export const IRIDOLOGY_CATEGORY_ORDER: readonly IridologyCategory[] = [
  'methodology',
  'zone-chart',
  'constitutional',
  'signs-fibers',
  'photo-guide',
  'safety',
];
