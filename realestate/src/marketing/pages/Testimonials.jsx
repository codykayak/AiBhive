import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { testimonials, caseStudies } from '../data/testimonials';
import layout from '../layout/site-layout.module.css';
import t from './testimonials.module.css';

export default function Testimonials() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NW Investor Real Estate',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: String(testimonials.length),
    },
    review: testimonials.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      datePublished: r.date,
      reviewBody: r.body,
      name: r.headline,
    })),
  };

  return (
    <>
      <SeoHead
        title="Testimonials & Case Studies | NW Investor Oregon Cash Buyer"
        description="Read how Oregon homeowners sold inherited, as-is, and probate properties fast with NW Investor. Case studies from Eugene, Springfield, Bend, Roseburg & more."
        path="/testimonials"
        jsonLd={jsonLd}
      />

      <section className={layout.section}>
        <div className={layout.container}>
          <p className={layout.breadcrumb}>
            <Link to="/">Home</Link> / Testimonials
          </p>
          <p className={layout.sectionLabel}>Social Proof</p>
          <h1 className={layout.sectionTitle}>Homeowner Stories & Case Studies</h1>
          <p className={layout.sectionSub}>
            Real situations like yours — fast closings, paperwork handled, fair communication. Names
            shortened for privacy; details representative of typical Oregon transactions.
          </p>
          <p className={layout.disclaimer}>
            Sample reviews for demonstration until verified client testimonials are published. Ratings
            reflect intended service standards, not third-party platform verification yet.
          </p>

          <div className={t.grid}>
            {testimonials.map((r) => (
              <article key={r.id} className={t.card} itemScope itemType="https://schema.org/Review">
                <div className={t.stars} aria-label={`${r.rating} out of 5 stars`}>
                  {'★'.repeat(r.rating)}
                </div>
                <h2 className={t.headline} itemProp="name">
                  {r.headline}
                </h2>
                <p className={t.body} itemProp="reviewBody">
                  {r.body}
                </p>
                <footer className={t.meta}>
                  <strong itemProp="author">{r.name}</strong>
                  <span>
                    {r.role} · {r.location}
                  </span>
                  <span className={t.tag}>{r.caseType}</span>
                  <time itemProp="datePublished">{r.date}</time>
                </footer>
              </article>
            ))}
          </div>

          <h2 className={layout.sectionTitle} style={{ marginTop: 64 }}>
            Case studies
          </h2>
          {caseStudies.map((c) => (
            <div key={c.title} className={layout.card} style={{ marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>{c.title}</h3>
              <p>{c.summary}</p>
              <ul>
                {c.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className={layout.ctaRow}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Get Your Estimate →
            </Link>
            <a href="/#offer" className={layout.ctaSecondary}>
              Share Your Situation
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
