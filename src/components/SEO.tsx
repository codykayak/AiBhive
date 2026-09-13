import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_OG_IMAGE,
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
  type?: 'WebSite' | 'SoftwareApplication' | 'WebPage' | 'WebApplication';
  /** Absolute or site-root path for social preview image */
  image?: string;
  /** Extra JSON-LD nodes merged into @graph */
  jsonLd?: Record<string, unknown>[];
  /** Emit FAQPage schema (answers must also be visible in page HTML) */
  faqs?: FaqSchemaItem[];
  /** Block search engines from indexing this page */
  noIndex?: boolean;
  /** Standalone JSON-LD script (e.g. Google JobPosting — not nested in @graph) */
  standaloneJsonLd?: Record<string, unknown>;
}

function resolveImageUrl(image?: string): string {
  if (!image) return DEFAULT_OG_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;
}

export const SEO = ({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  type = 'WebPage',
  image,
  jsonLd = [],
  faqs,
  noIndex = false,
  standaloneJsonLd,
}: SEOProps) => {
  const location = useLocation();
  const path = location.pathname === '/' ? '' : location.pathname;
  const currentUrl = `${SITE_URL}${path}`;
  const imageUrl = resolveImageUrl(image);

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
      name: title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`,
      url: currentUrl,
      description,
      image: imageUrl,
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
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <link rel="canonical" href={currentUrl} />
      <link rel="alternate" type="text/plain" href={`${SITE_URL}/llms.txt`} title="LLM index" />
      <link rel="alternate" type="text/plain" href={`${SITE_URL}/llms-full.txt`} title="LLM full corpus" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      {standaloneJsonLd ? (
        <script type="application/ld+json">{JSON.stringify(standaloneJsonLd)}</script>
      ) : null}
    </Helmet>
  );
};
