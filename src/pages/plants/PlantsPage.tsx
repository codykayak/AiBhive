import { useEffect } from 'react';
import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SEO_DESCRIPTION,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
  PLANTS_PUBLIC_PATH,
} from '../../lib/oregonPlantMedicine/branding';

/** Public home for AiBhive Plant ID and Holistic Remedies — aibhive.com/plants */
export default function PlantsPage() {
  useEffect(() => {
    const href = '/plants-app.webmanifest';
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"][data-plants-app]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      link.setAttribute('data-plants-app', '1');
      document.head.appendChild(link);
    }
    link.href = href;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-plants-app]');
    if (!theme) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = '#059669';
      m.setAttribute('data-plants-app', '1');
      document.head.appendChild(m);
    }
    return () => {
      link?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070a0f]">
      <SEO
        title={`${LIVING_KNOWLEDGE_APP_NAME} — Wild Edibles & Homeopathic Plants | AiBhive`}
        description={LIVING_KNOWLEDGE_SEO_DESCRIPTION}
        keywords={LIVING_KNOWLEDGE_SEO_KEYWORDS}
        type="WebApplication"
        jsonLd={[
          {
            '@type': 'WebApplication',
            name: LIVING_KNOWLEDGE_APP_NAME,
            description: LIVING_KNOWLEDGE_SEO_DESCRIPTION,
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
