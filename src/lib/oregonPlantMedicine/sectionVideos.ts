/** Section videos live in public/oregon-plant-medicine/ alongside plant photos. */
export type SectionVideo = {
  sources: string[];
  title: string;
  caption: string;
  page: string;
};

const OPM_DIR = '/oregon-plant-medicine';

function videoPath(fileName: string): string {
  return encodeURI(`${OPM_DIR}/${fileName}`);
}

export const SECTION_VIDEOS = {
  edibles: {
    sources: [
      videoPath('Edible and Medicinal Plant Guide Foraging Mushrooms and Herbs.mp4'),
      '/plant-medicine-foraging-aibhive.mp4',
    ],
    title: 'Edible & medicinal foraging',
    caption:
      'Wild plants, mushrooms, and herbs — field identification, habitat notes, and safe preparation across Oregon and Northern California.',
    page: 'Edibles',
  },
  holistic: {
    sources: [videoPath('animal-holistic-naturopathic-healing-and-remidies.mp4')],
    title: 'Holistic & naturopathic healing',
    caption:
      'Animal wellness, gentle remedies, and naturopathic traditions — educational context for people and pets. Not medical or veterinary advice.',
    page: 'Holistic protocols',
  },
  hypnosis: {
    sources: [
      // Committed filename has a double dot before .mp4
      videoPath('hipnotheropy-plrt-reiki healing energy work..mp4'),
      videoPath('hipnotheropy-plrt-reiki healing energy work.mp4'),
    ],
    title: 'Hypnotherapy, PLRT & Reiki',
    caption:
      'Past-life regression, clinical hypnotherapy, and energy-work overviews — mind-body approaches for research and exploration. Not licensed therapy.',
    page: 'Hypnosis & Energy',
  },
} as const satisfies Record<string, SectionVideo>;
