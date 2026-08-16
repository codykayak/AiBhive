import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  IRIDOLOGY_PATH,
  IRIDOLOGY_SEO_DESCRIPTION,
  IRIDOLOGY_TAB_LABEL,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/iridology */
export default function IridologyPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${IRIDOLOGY_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={IRIDOLOGY_SEO_DESCRIPTION}
        keywords={`iridology, iris analysis, Jensen zone chart, constitutional iris, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: IRIDOLOGY_TAB_LABEL,
          description: IRIDOLOGY_SEO_DESCRIPTION,
          path: IRIDOLOGY_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="iridology" />
    </div>
  );
}
