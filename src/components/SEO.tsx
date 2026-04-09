import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: 'WebSite' | 'SoftwareApplication';
}

export const SEO = ({ 
  title = "AiBhive - Multi-Agent AI Hive for Transcription & Voice Cloning",
  description = "AiBhive provides high-accuracy AI transcription, voice cloning, and translation services powered by a collaborative hive of specialized AI agents.",
  keywords = "AI transcription, voice cloning, AI translation, multi-agent AI, global content reach, AiBhive",
  type = "SoftwareApplication"
}: SEOProps) => {
  const location = useLocation();

  useEffect(() => {
    document.title = title;

    // Update Meta Tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = "keywords";
      meta.content = keywords;
      document.head.appendChild(meta);
    }

    // JSON-LD Schema
    const existingScript = document.getElementById('json-ld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": type,
      "name": "AiBhive",
      "url": window.location.origin,
      "description": description,
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      }
    };

    const script = document.createElement('script');
    script.id = 'json-ld-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

  }, [title, description, keywords, type, location]);

  return null;
};
