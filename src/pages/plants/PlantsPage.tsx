import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_TAGLINE,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Public home for Living Knowledge Plants and Medicine — aibhive.com/plants */
export default function PlantsPage() {
  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${LIVING_KNOWLEDGE_APP_NAME} — Wild Edibles & Homeopathic Plants | AiBhive`}
        description={`${LIVING_KNOWLEDGE_TAGLINE} Browse wild edibles, medicinal plants, and mushrooms across Oregon and Northern California — ID photos, look-alikes, and safety notes.`}
        keywords="Oregon wild edibles, Northern California foraging, edible mushrooms, medicinal plants, homeopathic remedies, plant identification, AiBhive"
        type="WebApplication"
        jsonLd={[
          {
            '@type': 'WebApplication',
            name: LIVING_KNOWLEDGE_APP_NAME,
            description: LIVING_KNOWLEDGE_TAGLINE,
            url: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
            applicationCategory: 'ReferenceApplication',
            operatingSystem: 'Web',
            provider: { '@type': 'Organization', name: 'AiBhive', url: 'https://aibhive.com' },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aibhive.com/' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Plants',
                item: `https://aibhive.com${PLANTS_PUBLIC_PATH}`,
              },
            ],
          },
        ]}
      />
      <OregonPlantMedicineWebApp expanded />
    </div>
  );
}
