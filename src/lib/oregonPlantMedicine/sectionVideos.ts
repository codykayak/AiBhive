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

function videoSources(baseName: string): string[] {
  return [videoPath(`${baseName}.webm`), videoPath(`${baseName}.mp4`)];
}

export const SECTION_VIDEOS = {
  home: {
    sources: videoSources('aibhive-holistic-health-wellness-community-and-library'),
    title: 'Holistic health, wellness & community',
    caption:
      'Oregon Plant Medicine brings together Pacific Northwest foraging, holistic protocols, hypnosis & energy research, and animal wellness — one living library for the PNW.',
    page: 'Home',
  },
  edibles: {
    sources: [
      ...videoSources('Edible and Medicinal Plant Guide Foraging Mushrooms and Herbs'),
      '/plant-medicine-foraging-aibhive.webm',
      '/plant-medicine-foraging-aibhive.mp4',
    ],
    title: 'Edible & medicinal foraging',
    caption:
      'Wild plants, mushrooms, and herbs — field identification, habitat notes, and safe preparation across Oregon and Northern California.',
    page: 'Edibles',
  },
  holistic: {
    sources: videoSources('animal-holistic-naturopathic-healing-and-remidies'),
    title: 'Holistic & naturopathic healing',
    caption:
      'PNW materia medica, gentle remedies, and naturopathic traditions — educational context for people and pets. Not medical or veterinary advice.',
    page: 'Holistic protocols',
  },
  hypnosis: {
    sources: [
      videoPath('hipnotheropy-plrt-reiki healing energy work..webm'),
      videoPath('hipnotheropy-plrt-reiki healing energy work..mp4'),
      videoPath('hipnotheropy-plrt-reiki healing energy work.webm'),
      videoPath('hipnotheropy-plrt-reiki healing energy work.mp4'),
    ],
    title: 'Hypnotherapy, PLRT & Reiki',
    caption:
      'Past-life regression, clinical hypnotherapy, and energy-work overviews — mind-body approaches for research and exploration. Not licensed therapy.',
    page: 'Hypnosis & Energy',
  },
} as const satisfies Record<string, SectionVideo>;

export type SectionVideoKey = keyof typeof SECTION_VIDEOS;
