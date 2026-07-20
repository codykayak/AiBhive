import type { ResearchTopicBase } from './topicLibraryTypes';

export type AnimalHealthCategory =
  | 'holistic-vet'
  | 'dogs-cats'
  | 'horses-livestock'
  | 'herbs-nutrition'
  | 'energy-modalities'
  | 'legal-safety';

export type AnimalHealthTopic = ResearchTopicBase & {
  category: AnimalHealthCategory;
};

export const ANIMAL_HEALTH_CATEGORY_LABELS: Record<AnimalHealthCategory, string> = {
  'holistic-vet': 'Holistic & integrative vet care',
  'dogs-cats': 'Dogs & cats',
  'horses-livestock': 'Horses & livestock',
  'herbs-nutrition': 'Herbs & nutrition',
  'energy-modalities': 'Energy & bodywork modalities',
  'legal-safety': 'Legal & safety',
};
