import type { ExternalLink } from './types';

export type HolisticCategory =
  | 'detox'
  | 'digestive'
  | 'immune'
  | 'nervous-system'
  | 'traditions'
  | 'modalities'
  | 'legal-safety';

export type HolisticPdfLink = {
  title: string;
  pdfUrl: string;
  description?: string;
};

export type HolisticTopic = {
  id: string;
  title: string;
  category: HolisticCategory;
  summary: string;
  /** Educational framing — not a diagnosis */
  whenPeopleExplore: string;
  approaches: string[];
  relatedPlantIds: string[];
  safetyWarnings: string[];
  sources: ExternalLink[];
  pdfLinks?: HolisticPdfLink[];
};

export const HOLISTIC_CATEGORY_LABELS: Record<HolisticCategory, string> = {
  detox: 'Detox & cleansing',
  digestive: 'Digestive & gut',
  immune: 'Immune & vitality',
  'nervous-system': 'Sleep & nervous system',
  traditions: 'Traditions & readings',
  modalities: 'Modalities & practices',
  'legal-safety': 'Legal & safety',
};
