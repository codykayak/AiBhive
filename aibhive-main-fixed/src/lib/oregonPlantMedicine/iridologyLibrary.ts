import type { IridologyCategory, IridologyTopic } from './iridologyTypes';
import { applyIridologyExpanded, matchesIridologyCategory } from './iridologyExpanded';

const IRIDOLOGY_LIBRARY_BASE = [
  {
    id: 'integrated-methodology',
    title: 'Integrated iridology — Jensen, European, and constitution together',
    category: 'methodology' as IridologyCategory,
    summary:
      'Integrated iridology cross-checks zone maps, physical signs, and constitutional color before stating the picture. AiBhive defaults to this methodology so Jensen clock sectors and European fiber signs have to agree.',
    whenPeopleExplore:
      'First visit to AI Iridology, or when comparing Jensen zones vs European physical signs vs constitutional typing.',
    approaches: [
      'Start with photo quality — refuse to guess from blurry iris detail.',
      'Map visible signs to clock hour, ring, and nearest organ zone.',
      'Pair fiber density with constitutional color before strong phrases.',
      'Look for corroboration across zones, fibers, and constitution.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Start with a sharp iris photo — fiber detail is the data.',
      'Acute eye pain, flashes, or a curtain over vision need urgent ophthalmology.',
    ],
    sources: [
      { label: 'International Iridology Practitioners Association', url: 'https://www.iridologyassn.org/' },
      {
        label: 'Felke Institute — structure, colour, constitutions',
        url: 'https://www.felke-institut.de/aid=273.phtml',
      },
    ],
  },
  {
    id: 'jensen-zone-chart',
    title: 'Bernard Jensen zone chart — clock-face iris sectors',
    category: 'zone-chart' as IridologyCategory,
    summary:
      'Bernard Jensen popularized clock-face zone maps linking iris sectors to body regions. Right iris reflects the right side; left iris the left — a foundational convention in many English-language iridology texts.',
    whenPeopleExplore:
      'Learning the “7–8 o’clock lung sector” references, or comparing right vs left eye charts.',
    approaches: [
      'Orient the photo: 12 o’clock is superior (toward forehead), 6 o’clock inferior.',
      'Right iris → right side zones; left iris → left side (classic Jensen convention).',
      'Map pigment spots and lacunae to the nearest sector, ring, and organ zone.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Zone charts vary slightly between authors — name the school you are using.',
      'Acute trauma and emergency symptoms need emergency care in the moment; the iris chart maps constitution and terrain.',
    ],
    sources: [
      { label: 'Bernard Jensen — Science and Practice of Iridology (clock-face charts)', url: 'https://www.iridologyassn.org/' },
      {
        label: 'Felke Institute — European iris topography',
        url: 'https://www.felke-institut.de/aid=273.phtml',
      },
    ],
  },
  {
    id: 'physical-european-signs',
    title: 'Physical / European iridology — fibers, lacunae, rings',
    category: 'signs-fibers' as IridologyCategory,
    summary:
      'European physical iridology emphasizes stromal texture: open vs dense fibers, lacunae, crypts, pigment spots, nerve rings, and arcus senilis as constitutional and terrain markers.',
    whenPeopleExplore:
      'Noticing “holes” in the iris, white rings, or brown spots and wondering what iridology texts say about them.',
    approaches: [
      'Assess global fiber density before interpreting local pits.',
      'Lacunae (open pits) vs crypts (closed pits) carry different traditional emphases.',
      'Fuchs crypts beside the collarette are common in lighter irides — distinguish them from ciliary organ-zone lacunae.',
      'Nerve rings mark nervous-system sensitivity and autonomic tone.',
      'Arcus at the limbus is read as a circulatory / lipid rim in European texts.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'If the globe looks injured, inflamed, or the cornea is cloudy, get ophthalmology before photographing.',
    ],
    sources: [
      {
        label: 'Felke Institute — structure, colour, constitutions (European school)',
        url: 'https://www.felke-institut.de/aid=273.phtml',
      },
    ],
  },
  {
    id: 'constitutional-iris-types',
    title: 'Constitutional iris typing — lymphatic, biliary, hematogenic',
    category: 'constitutional' as IridologyCategory,
    summary:
      'Constitutional iridology reads base iris color and fiber density as lymphatic, biliary, hematogenic, or mixed types — constitution, not ethnicity.',
    whenPeopleExplore:
      'Wondering why two irises look completely different, or what “lymphatic constitution” means in iridology books.',
    approaches: [
      'Observe base iris color in daylight — camera white balance skews typing.',
      'Pair color with fiber density before assigning a type.',
      'Use types as constitution language — lymphatic, biliary, hematogenic, or mixed.',
      'Mixed patterns are common — avoid forced single-type labels.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Photograph constitution in daylight when you can — camera white balance can skew type.',
    ],
    sources: [
      { label: 'Iridology constitutional typing — IIPA', url: 'https://www.iridologyassn.org/' },
    ],
  },
  {
    id: 'iris-photo-guide',
    title: 'Iris photo capture — quality gates for AI analysis',
    category: 'photo-guide' as IridologyCategory,
    summary:
      'Iridology reads fine stromal detail that phone cameras compress away. Indirect window light, one eye per photo, and gentle eyelid positioning produce the best chart reads.',
    whenPeopleExplore:
      'Before uploading to AiBhive iridology analysis, or after a “poor photo quality” retake prompt.',
    approaches: [
      'Stand near a window — indirect daylight works best.',
      'Use rear camera macro if available; pull eyelids gently without distorting the globe.',
      'One eye per photo unless comparing both deliberately.',
      'Avoid red-eye reduction flash — it washes out fiber detail.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Never shine lasers or bright LEDs directly into the eye.',
      'If eyes are painful, red, or vision is changing — see an ophthalmologist.',
    ],
    sources: [
      {
        label: 'Iris recognition — why iris structure is biometrically stable',
        url: 'https://en.wikipedia.org/wiki/Iris_recognition',
      },
    ],
  },
  {
    id: 'iridology-safety',
    title: 'When the eye itself needs a doctor',
    category: 'safety' as IridologyCategory,
    summary:
      'Iridology reads constitution and organ-zone emphasis in the iris. Pain, redness, flashes, a curtain over vision, or a cloudy cornea are globe emergencies — get ophthalmology first, then return to the chart when the eye is safe to photograph.',
    whenPeopleExplore:
      'Before photographing a painful or inflamed eye, or after noticing flashes, curtains, or sudden vision change.',
    approaches: [
      'Photograph only a comfortable, uninjured eye in indirect window light.',
      'Treat flashes, curtains, chemical burns, and severe pain as urgent eye-care events.',
      'Use iridology for constitution and terrain mapping alongside the rest of your wellness work.',
      'Retake rather than guessing when stroma is blurry.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Never shine lasers or bright LEDs into the eye.',
      'Sudden vision changes, eye pain, or flashes need urgent ophthalmology.',
    ],
    sources: [
      {
        label: 'International Iridology Practitioners Association',
        url: 'https://www.iridologyassn.org/',
      },
      {
        label: 'Felke Institute — European iridology school',
        url: 'https://www.felke-institut.de/aid=273.phtml',
      },
    ],
  },
];

export const IRIDOLOGY_LIBRARY: IridologyTopic[] = applyIridologyExpanded(IRIDOLOGY_LIBRARY_BASE);

export { matchesIridologyCategory };
