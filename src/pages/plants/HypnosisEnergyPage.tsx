import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  HYPNOSIS_ENERGY_PATH,
  HYPNOSIS_ENERGY_TAB_LABEL,
  HYPNOSIS_SEO_DESCRIPTION,
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Canonical URL: aibhive.com/plants/hypnosis-and-energy */
export default function HypnosisEnergyPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${HYPNOSIS_ENERGY_TAB_LABEL} | ${LIVING_KNOWLEDGE_APP_NAME}`}
        description={HYPNOSIS_SEO_DESCRIPTION}
        keywords={`hypnosis, past life regression, Dolores Cannon, QHHT, Edgar Cayce, Reiki, chakra, Solfeggio frequencies, ${LIVING_KNOWLEDGE_SEO_KEYWORDS}`}
        jsonLd={[
          {
            '@type': 'WebPage',
            name: HYPNOSIS_ENERGY_TAB_LABEL,
            description: HYPNOSIS_SEO_DESCRIPTION,
            url: `https://aibhive.com${HYPNOSIS_ENERGY_PATH}`,
            isPartOf: {
              '@type': 'WebApplication',
              name: LIVING_KNOWLEDGE_APP_NAME,
              url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aibhive.com/' },
              { '@type': 'ListItem', position: 2, name: 'Plants', item: `https://aibhive.com${PLANTS_PUBLIC_PATH}` },
              {
                '@type': 'ListItem',
                position: 3,
                name: HYPNOSIS_ENERGY_TAB_LABEL,
                item: `https://aibhive.com${HYPNOSIS_ENERGY_PATH}`,
              },
            ],
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded initialTab="hypnosis" />
    </div>
  );
}
