import type { IridologyCategory, IridologyTopic } from './iridologyTypes';

type ExpandedFields = {
  imageUrl: string;
  imageCredit?: string;
  deepDive: string;
};

const IRIDOLOGY_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  'integrated-methodology': {
    imageUrl: '/oregon-plant-medicine/iridology/integrated-methodology.jpg',
    imageCredit: 'AiBhive Living Knowledge — integrated iridology illustration',
    deepDive:
      'Integrated iridology is AiBhive’s default stance: do not lean on a single school. Cross-check (1) Jensen-style clock-face zones, (2) European physical signs such as fiber density, lacunae, crypts, pigment spots, and nerve rings, and (3) constitutional color typing. Photo quality is a hard gate — if stroma is blurry, retake. The read describes constitution, inherited tissue quality, and organ-zone emphasis from those charts.',
  },
  'jensen-zone-chart': {
    imageUrl: '/oregon-plant-medicine/iridology/jensen-zone-chart.jpg',
    imageCredit: 'AiBhive Living Knowledge — Jensen zone chart illustration',
    deepDive:
      'Bernard Jensen popularized clock-face iris charts that map sectors to body regions. Classic English-language convention: 12 o’clock is superior (toward the forehead), 6 o’clock inferior; the right iris reflects the right side of the body and the left iris the left. Pigment spots and lacunae are read relative to the nearest sector, ring, and fiber quality — the working language of Jensen iridology.',
  },
  'physical-european-signs': {
    imageUrl: '/oregon-plant-medicine/iridology/iris-fibers.jpg',
    imageCredit: 'AiBhive Living Knowledge — iris fiber detail illustration',
    deepDive:
      'European physical iridology emphasizes stromal texture more than clock zones. Dense vs open fibers, lacunae (open pits) vs crypts (closed pits), pigment spots, nerve rings, and arcus senilis at the limbus are terrain markers. Assess global fiber density before interpreting a local pit. Fuchs crypts beside the collarette are common in lighter irides — distinguish them from ciliary organ-zone lacunae. Nerve rings mark nervous-system sensitivity and autonomic tone. If the globe looks injured, inflamed, or the cornea is cloudy, get ophthalmology before photographing.',
  },
  'constitutional-iris-types': {
    imageUrl: '/oregon-plant-medicine/iridology/constitutional-types.jpg',
    imageCredit: 'AiBhive Living Knowledge — constitutional iris types illustration',
    deepDive:
      'Constitutional iridology groups base iris color and fiber density into lymphatic (lighter / blue), biliary (mixed / hazel-green), and hematogenic (deeper brown) types. Camera white balance skews color; daylight observation is more reliable. Mixed patterns are common — do not force a single-type label.',
  },
  'iris-photo-guide': {
    imageUrl: '/oregon-plant-medicine/iridology/photo-guide.jpg',
    imageCredit: 'AiBhive Living Knowledge — iris photo capture guide',
    deepDive:
      'Iridology needs fine stromal detail that phone cameras often compress away. Best captures: stand near a window in indirect daylight, use the rear camera macro if available, photograph one eye at a time, and gently position eyelids without distorting the globe. Avoid red-eye reduction flash. Never shine lasers or bright LEDs into the eye. Painful, red, or changing vision needs an ophthalmologist before another photo.',
  },
  'iridology-safety': {
    imageUrl: '/oregon-plant-medicine/iridology/safety.jpg',
    imageCredit: 'AiBhive Living Knowledge — iridology safety illustration',
    deepDive:
      'Iridology maps constitution and organ-zone emphasis in the iris. If the globe itself is in trouble — sudden vision change, eye pain, flashes, a curtain over vision, chemical burn, or a cloudy cornea — that is ophthalmology first. Photograph only a comfortable eye. Poor photo quality is a retake, not a guess.',
  },
};

export function applyIridologyExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = IRIDOLOGY_TOPIC_EXPANDED[topic.id];
    if (!extra) {
      return {
        ...topic,
        imageUrl: '',
        deepDive: topic.summary,
      };
    }
    return {
      ...topic,
      ...extra,
    };
  });
}

export function matchesIridologyCategory(
  topic: IridologyTopic,
  category: IridologyCategory | 'all',
): boolean {
  return category === 'all' || topic.category === category;
}
