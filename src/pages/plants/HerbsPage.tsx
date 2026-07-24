import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  HERBS_PATH,
  HERBS_SEO_DESCRIPTION,
  HERBS_TAB_LABEL,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/herbs */
export default function HerbsPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${HERBS_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={HERBS_SEO_DESCRIPTION}
        keywords={`herbs, TCM, Ayurveda, materia medica, ashwagandha, ginseng, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: HERBS_TAB_LABEL,
          description: HERBS_SEO_DESCRIPTION,
          path: HERBS_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="herbs" />
    </div>
  );
}
