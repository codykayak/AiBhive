import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  SUPPLEMENTS_PATH,
  SUPPLEMENTS_SEO_DESCRIPTION,
  SUPPLEMENTS_TAB_LABEL,
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/supplements */
export default function SupplementsPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${SUPPLEMENTS_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description={SUPPLEMENTS_SEO_DESCRIPTION}
        keywords={`supplements, vitamins, minerals, omega-3, probiotics, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={[
          {
            '@type': 'WebPage',
            name: SUPPLEMENTS_TAB_LABEL,
            description: SUPPLEMENTS_SEO_DESCRIPTION,
            url: `https://aibhive.com${SUPPLEMENTS_PATH}`,
            isPartOf: {
              '@type': 'WebApplication',
              name: LIVING_KNOWLEDGE_APP_NAME,
              url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            },
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="supplements" />
    </div>
  );
}
