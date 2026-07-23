import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  HOLISTIC_REMEDIES_PATH,
  HOLISTIC_SEO_DESCRIPTION,
  HOLISTIC_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/holistic-remedies-and-protocols */
export default function HolisticRemediesPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${HOLISTIC_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description={HOLISTIC_SEO_DESCRIPTION}
        keywords={`holistic remedies, Edgar Cayce, parasite cleanse overview, detox protocols, PNW materia medica, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={[
          {
            '@type': 'WebPage',
            name: HOLISTIC_TAB_LABEL,
            description: HOLISTIC_SEO_DESCRIPTION,
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
