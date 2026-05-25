import { useEffect } from 'react';
import { SITE_URL } from '../utils/templateImages';

/**
 * Per-route SEO without pulling map bundles into marketing pages.
 */
export default function SeoHead({
  title,
  description,
  path = '/',
  keywords = '',
  jsonLd = null,
  ogImage = `${SITE_URL}/Template/nwinvestor hero background invester properties oregon.png`,
}) {
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  useEffect(() => {
    document.title = title;

    const setMeta = (selector, content, attr = 'content') => {
      if (!content) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [key, val] = selector.replace('meta[', '').replace(']', '').split('=');
        el.setAttribute(key.replace(/['"]/g, ''), val.replace(/['"]/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[name="keywords"]', keywords);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    const existing = document.getElementById('page-jsonld');
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'page-jsonld';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, canonical, ogImage, jsonLd]);

  return null;
}
