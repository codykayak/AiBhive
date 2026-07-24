import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  SUPPLEMENTS_PATH,
  SUPPLEMENTS_SEO_DESCRIPTION,
  SUPPLEMENTS_TAB_LABEL,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/supplements */
export default function SupplementsPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${SUPPLEMENTS_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={SUPPLEMENTS_SEO_DESCRIPTION}
        keywords={`supplements, vitamins, minerals, omega-3, probiotics, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: SUPPLEMENTS_TAB_LABEL,
          description: SUPPLEMENTS_SEO_DESCRIPTION,
          path: SUPPLEMENTS_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="supplements" />
    </div>
  );
}
