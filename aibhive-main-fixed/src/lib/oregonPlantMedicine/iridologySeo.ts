import { IRIDOLOGY_LIBRARY } from './iridologyLibrary';
import {
  AIBHIVE_PLANTS_APP_NAME,
  IRIDOLOGY_PATH,
  IRIDOLOGY_SEO_DESCRIPTION,
  IRIDOLOGY_TAB_LABEL,
  PLANTS_PUBLIC_PATH,
} from './branding';
import { plantsBreadcrumbJsonLd, plantsMobileAppJsonLd, plantsWebAppJsonLd } from './plantsSeo';

export const IRIDOLOGY_OG_IMAGE = '/oregon-plant-medicine/iridology/ai-iridology-featured.jpg';

export const IRIDOLOGY_SEO_KEYWORDS =
  'AI iridology, iris analysis, Bernard Jensen zone chart, European iridology, lacunae, iris fibers, constitutional iris types, lymphatic biliary hematogenic, iris photo capture, Grok vision iris, AiBhivePlants iridology, Deck Felke constitution';

export type IridologyFaq = { question: string; answer: string };

/** Visible on-page FAQ copy — also emitted as FAQPage JSON-LD. */
export const IRIDOLOGY_FAQS: IridologyFaq[] = [
  {
    question: 'What is AI Iridology on AiBhive?',
    answer:
      'AI Iridology on AiBhive is an iris library and Grok vision walkthrough at aibhive.com/plants/iridology. It reads visible iris architecture using Jensen zones, European physical signs, and constitutional typing — constitution, tissue quality, and organ-zone emphasis from a clear photo.',
  },
  {
    question: 'What does an iridology reading describe?',
    answer:
      'Iridology maps constitution, inherited tissue quality, and organ-zone emphasis using Jensen clock charts and European physical signs (fibers, lacunae, nerve rings, collarette). AiBhive’s AI reads those charts from a clear iris photo. Eye pain, vision changes, flashes, or a curtain over vision still need urgent ophthalmology — those are globe emergencies, not iris-chart questions.',
  },
  {
    question: 'How should I photograph an iris for analysis?',
    answer:
      'Use indirect window light, one eye per photo, and a rear camera macro if available. Avoid red-eye flash and never shine lasers or bright LEDs into the eye. If the app says photo quality is poor, retake rather than guessing from blurry stroma.',
  },
  {
    question: 'What iridology topics are in the library?',
    answer:
      'The library covers integrated methodology, Bernard Jensen clock-face zone charts, European physical signs (fibers, lacunae, nerve rings), constitutional iris types, iris photo capture, and when the globe itself needs an eye doctor. Featured video and a long-form essay sit at the top of the page.',
  },
];

export function plantsIridologyJsonLd(): Record<string, unknown>[] {
  const pageUrl = `https://aibhive.com${IRIDOLOGY_PATH}`;
  return [
    {
      '@type': 'CollectionPage',
      name: IRIDOLOGY_TAB_LABEL,
      description: IRIDOLOGY_SEO_DESCRIPTION,
      url: pageUrl,
      image: `https://aibhive.com${IRIDOLOGY_OG_IMAGE}`,
      isPartOf: plantsWebAppJsonLd(),
      about: {
        '@type': 'Thing',
        name: 'Iridology',
        description:
          'Study of iris appearance — zones, fibers, and constitutional patterns — as mapped in Jensen and European iridology.',
      },
      mainEntity: {
        '@type': 'ItemList',
        name: `${IRIDOLOGY_TAB_LABEL} educational topics`,
        numberOfItems: IRIDOLOGY_LIBRARY.length,
        itemListElement: IRIDOLOGY_LIBRARY.map((topic, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: topic.title,
          url: `${pageUrl}#${topic.id}`,
          image: topic.imageUrl ? `https://aibhive.com${topic.imageUrl}` : undefined,
        })),
      },
    },
    plantsBreadcrumbJsonLd([
      { name: AIBHIVE_PLANTS_APP_NAME, path: PLANTS_PUBLIC_PATH },
      { name: IRIDOLOGY_TAB_LABEL, path: IRIDOLOGY_PATH },
    ]),
    plantsMobileAppJsonLd(),
  ];
}
