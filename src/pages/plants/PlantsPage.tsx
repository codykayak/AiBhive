import { useEffect } from 'react';
import { SEO } from '../../components/SEO';
import OregonPlantMedicineWebApp from '../../components/hive-apps/OregonPlantMedicineWebApp';
import {
  AIBHIVE_PLANTS_APP_NAME,
  LIVING_KNOWLEDGE_SEO_DESCRIPTION,
  LIVING_KNOWLEDGE_SEO_KEYWORDS,
} from '../../lib/oregonPlantMedicine/branding';
import { plantsHomeJsonLd } from '../../lib/oregonPlantMedicine/plantsSeo';

/** Public home for AiBhivePlants — aibhive.com/plants */
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
    <div className="min-h-screen">
      <SEO
        title={`${AIBHIVE_PLANTS_APP_NAME} — Wild Plant ID, Foraging & Holistic Remedies | AiBhive`}
        description={LIVING_KNOWLEDGE_SEO_DESCRIPTION}
        keywords={LIVING_KNOWLEDGE_SEO_KEYWORDS}
        type="SoftwareApplication"
        jsonLd={plantsHomeJsonLd()}
      />
      <OregonPlantMedicineWebApp expanded />
    </div>
  );
}
