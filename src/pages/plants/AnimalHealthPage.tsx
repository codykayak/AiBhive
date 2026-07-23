import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  ANIMAL_HEALTH_PATH,
  ANIMAL_HEALTH_SEO_DESCRIPTION,
  ANIMAL_HEALTH_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/animal-health */
export default function AnimalHealthPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${ANIMAL_HEALTH_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description={ANIMAL_HEALTH_SEO_DESCRIPTION}
        keywords={`animal health, holistic vet, dog gut health, cat kidney, horse acupuncture, pet CBD, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={[
          {
            '@type': 'WebPage',
            name: ANIMAL_HEALTH_TAB_LABEL,
            description: ANIMAL_HEALTH_SEO_DESCRIPTION,
            url: `https://aibhive.com${ANIMAL_HEALTH_PATH}`,
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
                name: ANIMAL_HEALTH_TAB_LABEL,
                item: `https://aibhive.com${ANIMAL_HEALTH_PATH}`,
              },
            ],
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="animal-health" />
    </div>
  );
}
