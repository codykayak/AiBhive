import type { ResearchTopicBase } from './topicLibraryTypes';

export type HerbsCategory =
  | 'western-herbalism'
  | 'chinese-tcm'
  | 'ayurvedic-far-east'
  | 'pacific-northwest'
  | 'preparation-safety';

export type HerbsTopic = ResearchTopicBase & {
  category: HerbsCategory;
};

export const HERBS_CATEGORY_LABELS: Record<HerbsCategory, string> = {
  'western-herbalism': 'Western herbalism',
  'chinese-tcm': 'Chinese medicine (TCM)',
  'ayurvedic-far-east': 'Ayurveda & Far East',
  'pacific-northwest': 'Pacific Northwest materia medica',
  'preparation-safety': 'Preparation & safety',
};
