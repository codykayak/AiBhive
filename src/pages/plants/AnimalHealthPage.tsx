import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  ANIMAL_HEALTH_PATH,
  ANIMAL_HEALTH_SEO_DESCRIPTION,
  ANIMAL_HEALTH_TAB_LABEL,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/animal-health */
export default function AnimalHealthPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${ANIMAL_HEALTH_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={ANIMAL_HEALTH_SEO_DESCRIPTION}
        keywords={`animal health, holistic vet, dog gut health, cat kidney, horse acupuncture, pet CBD, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: ANIMAL_HEALTH_TAB_LABEL,
          description: ANIMAL_HEALTH_SEO_DESCRIPTION,
          path: ANIMAL_HEALTH_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="animal-health" />
    </div>
  );
}
