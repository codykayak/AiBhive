import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  HYPNOSIS_ENERGY_PATH,
  HYPNOSIS_ENERGY_TAB_LABEL,
  HYPNOSIS_SEO_DESCRIPTION,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsTopicPageJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Canonical URL: aibhive.com/plants/hypnosis-and-energy */
export default function HypnosisEnergyPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title={`${HYPNOSIS_ENERGY_TAB_LABEL} | ${AIBHIVE_PLANTS_APP_NAME}`}
        description={HYPNOSIS_SEO_DESCRIPTION}
        keywords={`hypnosis, past life regression, Dolores Cannon, QHHT, Edgar Cayce, Reiki, chakra, Solfeggio frequencies, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={plantsTopicPageJsonLd({
          name: HYPNOSIS_ENERGY_TAB_LABEL,
          description: HYPNOSIS_SEO_DESCRIPTION,
          path: HYPNOSIS_ENERGY_PATH,
        })}
      />
      <OregonPlantMedicineWebApp expanded initialTab="hypnosis" />
    </div>
  );
}
