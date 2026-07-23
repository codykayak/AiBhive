import type { ExternalLink } from './types';

/** Research libraries that support community posts and upvotes. */
export type TopicLibraryId = 'hypnosis' | 'holistic' | 'animal-health' | 'herbs' | 'supplements';

export type ResearchTopicBase = {
  id: string;
  title: string;
  summary: string;
  /** Hero image for card grid (Wikimedia or community CDN). */
  imageUrl: string;
  imageCredit?: string;
  /** In-depth article body — target 250–500 words. */
  deepDive: string;
  whenPeopleExplore: string;
  approaches: string[];
  relatedPlantIds: string[];
  safetyWarnings: string[];
  sources: ExternalLink[];
};

export type TopicMedicinePost = {
  id: string;
  library: TopicLibraryId | null;
  topicId: string | null;
  plantId: string | null;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  type: 'comment' | 'photo';
  text: string;
  imageUrl: string | null;
  status: string;
  upvoteCount: number;
  createdAt: string | null;
  viewerHasUpvoted: boolean;
};
