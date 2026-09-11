import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  IRIDOLOGY_SEO_DESCRIPTION,
  IRIDOLOGY_TAB_LABEL,
} from '../../lib/oregonPlantMedicine/branding';
import {
  IRIDOLOGY_FAQS,
  IRIDOLOGY_OG_IMAGE,
  IRIDOLOGY_SEO_KEYWORDS,
  plantsIridologyJsonLd,
} from '../../lib/oregonPlantMedicine/iridologySeo';

/** Canonical URL: aibhive.com/plants/iridology */
export default function IridologyPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${IRIDOLOGY_TAB_LABEL} — Iris Zone Charts, Physical Signs & Grok Vision | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={IRIDOLOGY_SEO_DESCRIPTION}
        keywords={IRIDOLOGY_SEO_KEYWORDS}
        type="WebPage"
        image={IRIDOLOGY_OG_IMAGE}
        faqs={IRIDOLOGY_FAQS}
        jsonLd={plantsIridologyJsonLd()}
      />
      <OregonPlantMedicineWebApp expanded initialTab="iridology" />
    </div>
  );
}
