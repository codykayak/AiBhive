import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_SEO,
  ORGANIZATION_SCHEMA,
  SITE_NAME,
  SITE_URL,
} from '../constants/site';

export type FaqSchemaItem = { question: string; answer: string };

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  type?: 'WebSite' | 'SoftwareApplication';
  /** Extra JSON-LD nodes merged into @graph */
  jsonLd?: Record<string, unknown>[];
  /** Emit FAQPage schema (answers must also be visible in page HTML) */
  faqs?: FaqSchemaItem[];
  /** Block search engines from indexing this page */
  noIndex?: boolean;
}

export const SEO = ({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  type = 'SoftwareApplication',
  jsonLd = [],
  faqs,
  noIndex = false,
}: SEOProps) => {
  const location = useLocation();
  const path = location.pathname === '/' ? '' : location.pathname;
  const currentUrl = `${SITE_URL}${path}`;

  const graph: Record<string, unknown>[] = [
    ORGANIZATION_SCHEMA,
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_SEO.description,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@type': type,
      name: SITE_NAME,
      url: SITE_URL,
      description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
      },
    },
    ...jsonLd,
  ];

  if (faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  return (
    <Helmet>
      <title>{title}</title>
      {noIndex && <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
