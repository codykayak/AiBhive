import { Link, useParams, Navigate } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import ResponsiveImage from '../components/ResponsiveImage';
import { getCityBySlug } from '../data/cities';
import { cityImageCandidates, PHONE_DISPLAY, PHONE_TEL, SITE_URL } from '../utils/templateImages';
import layout from '../layout/site-layout.module.css';

export default function CityWeBuyHouses() {
  const { citySlug } = useParams();
  const city = getCityBySlug(citySlug);

  if (!city) return <Navigate to="/" replace />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `We Buy Houses in ${city.name}, Oregon`,
    provider: { '@type': 'RealEstateAgent', name: 'NW Investor Real Estate', telephone: PHONE_TEL },
    areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: 'Oregon' } },
    description: city.metaDescription,
    url: `${SITE_URL}/we-buy-houses/${city.slug}`,
  };

  return (
    <>
      <SeoHead
        title={`We Buy Houses in ${city.name}, OR | Cash Home Buyer | NW Investor`}
        description={city.metaDescription}
        path={`/we-buy-houses/${city.slug}`}
        keywords={`we buy houses ${city.name}, cash home buyer ${city.name} OR, sell house fast ${city.county}`}
        jsonLd={jsonLd}
      />

      <section className={layout.heroPage}>
        <ResponsiveImage
          candidates={cityImageCandidates(city.name)}
          alt={city.heroAlt}
          className={layout.heroPageBg}
        />
        <div className={layout.heroPageOverlay} />
        <div className={`${layout.container} ${layout.heroPageContent}`}>
          <p className={layout.breadcrumb}>
            <Link to="/">Home</Link> / We Buy Houses / {city.name}
          </p>
          <p className={layout.sectionLabel}>{city.county}</p>
          <h1 className={layout.sectionTitle}>We Buy Houses in {city.name}, Oregon</h1>
          <p className={layout.sectionSub}>
            Fast, fair, as-is cash purchases. No repairs, no commissions, no endless showings.
            Inherited, probate, landlord, or distressed — we help {city.name} sellers close on your timeline.
          </p>
          <div className={layout.ctaRow}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Instant Cash Calculator →
            </Link>
            <a href={`tel:${PHONE_TEL}`} className={layout.ctaSecondary}>
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className={layout.section}>
        <div className={`${layout.container} ${layout.prose}`}>
          <h2>Local market reality for sellers who need out</h2>
          <p>{city.marketContext}</p>

          <h3>Common situations we solve in {city.name}</h3>
          <ul>
            {city.sellerPainPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <h3>Why a cash sale can make sense here</h3>
          <p>{city.whyCash}</p>

          <p>
            ZIP codes we regularly buy in include: {city.zipSamples.join(', ')} and surrounding
            areas. Not sure if your property qualifies? Use the{' '}
            <Link to="/cash-offer-calculator">cash offer calculator</Link> or call for a no-pressure
            conversation.
          </p>

          <div className={layout.card} style={{ marginTop: 32 }}>
            <h3 style={{ marginTop: 0 }}>Related resources</h3>
            <p>
              <Link to="/probate-inherited-house-guide">Probate & inherited house guide</Link>
              {' · '}
              <Link to="/selling-vs-cash-offer">Selling vs cash offer comparison</Link>
              {' · '}
              <Link to="/testimonials">Homeowner stories</Link>
            </p>
          </div>

          <div className={layout.ctaRow}>
            <a href="/#offer" className={layout.ctaPrimary}>
              Get My Cash Offer in {city.name} →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
