import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  AUTOIMMUNE_PATH,
  AUTOIMMUNE_SEO_DESCRIPTION,
  AUTOIMMUNE_TAB_LABEL,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/autoimmune */
export default function AutoimmunePage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${AUTOIMMUNE_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={AUTOIMMUNE_SEO_DESCRIPTION}
        keywords={`autoimmune, Hashimoto's, rheumatoid arthritis, lupus, MS, IBD, mitochondria, circadian, EMF, AIP, holistic, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: AUTOIMMUNE_TAB_LABEL,
          description: AUTOIMMUNE_SEO_DESCRIPTION,
          path: AUTOIMMUNE_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="autoimmune" />
    </div>
  );
}
