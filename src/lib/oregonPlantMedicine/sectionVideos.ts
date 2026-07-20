/** Section intro videos under `public/Oregon Plant Medicine/`. */
export type SectionVideo = {
  src: string;
  title: string;
  caption: string;
  /** Human-readable page label (for accessibility / filler copy). */
  page: string;
};

const OPM_VIDEO_DIR = '/Oregon Plant Medicine';

function videoPath(filename: string): string {
  return encodeURI(`${OPM_VIDEO_DIR}/${filename}`);
}

export const SECTION_VIDEOS = {
  edibles: {
    src: videoPath('Edible and Medicinal Plant Guide Foraging Mushrooms and Herbs.mp4'),
    title: 'Edible & medicinal foraging',
    caption:
      'Wild plants, mushrooms, and herbs — field identification, habitat notes, and safe preparation across Oregon and Northern California.',
    page: 'Edibles',
  },
  holistic: {
    src: videoPath('animal-holistic-naturopathic-healing-and-remidies.mp4'),
    title: 'Holistic & naturopathic healing',
    caption:
      'Animal wellness, gentle remedies, and naturopathic traditions — educational context for people and pets. Not medical or veterinary advice.',
    page: 'Holistic protocols',
  },
  hypnosis: {
    src: videoPath('hipnotheropy-plrt-reiki healing energy work.mp4'),
    title: 'Hypnotherapy, PLRT & Reiki',
    caption:
      'Past-life regression, clinical hypnotherapy, and energy-work overviews — mind-body approaches for research and exploration. Not licensed therapy.',
    page: 'Hypnosis & Energy',
  },
} as const satisfies Record<string, SectionVideo>;
