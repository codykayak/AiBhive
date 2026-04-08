import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: 'WebSite' | 'SoftwareApplication';
}

export const SEO = ({ 
  title = "AIBhive - 99% Accurate Translation | Transcription and Voice Cloning - Bulk Enterpize",
  description = "Instant AI voice cloning, legal and medical transcription, and translation services. AIBhive provides bulk enterprise tools to multiply your content.",
  keywords = "AI translation, AI transcription, voice cloning, content creation suite, translation service, AIBhive, bulk enterprise",
  type = "SoftwareApplication"
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = `https://aibeehive.com${location.pathname === '/' ? '' : location.pathname}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    "name": "AIBhive",
    "url": "https://aibeehive.com",
    "description": description,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical Tag */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
