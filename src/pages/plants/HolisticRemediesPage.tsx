import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  HOLISTIC_REMEDIES_PATH,
  HOLISTIC_SEO_DESCRIPTION,
  HOLISTIC_TAB_LABEL,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/holistic-remedies-and-protocols */
export default function HolisticRemediesPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${HOLISTIC_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={HOLISTIC_SEO_DESCRIPTION}
        keywords={`holistic remedies, Edgar Cayce, parasite cleanse overview, detox protocols, PNW materia medica, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: HOLISTIC_TAB_LABEL,
          description: HOLISTIC_SEO_DESCRIPTION,
          path: HOLISTIC_REMEDIES_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="holistic" />
    </div>
  );
}
