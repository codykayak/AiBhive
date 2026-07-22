import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  HERBS_PATH,
  HERBS_SEO_DESCRIPTION,
  HERBS_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/herbs */
export default function HerbsPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${HERBS_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description={HERBS_SEO_DESCRIPTION}
        keywords={`herbs, TCM, Ayurveda, materia medica, ashwagandha, ginseng, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={[
          {
            '@type': 'WebPage',
            name: HERBS_TAB_LABEL,
            description: HERBS_SEO_DESCRIPTION,
            url: `https://aibhive.com${HERBS_PATH}`,
            isPartOf: {
              '@type': 'WebApplication',
              name: LIVING_KNOWLEDGE_APP_NAME,
              url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            },
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="herbs" />
    </div>
  );
}
