import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  ANIMAL_HEALTH_PATH,
  ANIMAL_HEALTH_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/animal-health */
export default function AnimalHealthPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${ANIMAL_HEALTH_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description="Educational animal health research — holistic vet overview, dog and cat wellness, horse bodywork, livestock, herbs, CBD, and emergency guidance. Not veterinary advice."
        keywords="animal health, holistic vet, dog gut health, cat kidney, horse acupuncture, pet CBD, Reiki animals, Living Knowledge, AiBhive"
        jsonLd={[
          {
            '@type': 'WebPage',
            name: ANIMAL_HEALTH_TAB_LABEL,
            description: 'Animal health — educational living knowledge library.',
            url: `https://aibhive.com${ANIMAL_HEALTH_PATH}`,
            isPartOf: {
              '@type': 'WebApplication',
              name: LIVING_KNOWLEDGE_APP_NAME,
              url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            },
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="animal-health" />
    </div>
  );
}
