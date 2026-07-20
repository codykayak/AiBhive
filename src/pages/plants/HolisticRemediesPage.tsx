import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  HOLISTIC_REMEDIES_PATH,
  HOLISTIC_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/holistic-remedies-and-protocols */
export default function HolisticRemediesPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${HOLISTIC_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description="Educational holistic remedies and protocols — Edgar Cayce traditions, gentle detox overviews, and safety notes. Cross-linked to wild plants and mushrooms. Not medical advice."
        keywords="holistic remedies, Edgar Cayce, parasite cleanse overview, detox protocols, homeopathic education, Living Knowledge, AiBhive"
        jsonLd={[
          {
            '@type': 'WebPage',
            name: HOLISTIC_TAB_LABEL,
            description: 'Holistic remedies and protocols — educational living knowledge library.',
            url: `https://aibhive.com${HOLISTIC_REMEDIES_PATH}`,
            isPartOf: {
              '@type': 'WebApplication',
              name: LIVING_KNOWLEDGE_APP_NAME,
              url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aibhive.com/' },
              { '@type': 'ListItem', position: 2, name: 'Plants', item: `https://aibhive.com${PLANTS_PUBLIC_PATH}` },
              {
                '@type': 'ListItem',
                position: 3,
                name: HOLISTIC_TAB_LABEL,
                item: `https://aibhive.com${HOLISTIC_REMEDIES_PATH}`,
              },
            ],
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="holistic" />
    </div>
  );
}
