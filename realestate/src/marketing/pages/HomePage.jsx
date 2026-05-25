import { useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import ResponsiveImage from '../components/ResponsiveImage';
import { images, PHONE_DISPLAY, PHONE_TEL, SITE_URL } from '../utils/templateImages';
import { cities } from '../data/cities';
import layout from '../layout/site-layout.module.css';
import home from './home.module.css';

const FAQ = [
  {
    q: 'Do I have to go through full probate to sell?',
    a: 'Not always. In some cases we can buy using a Small Estate Affidavit or Heirship Affidavit. We\'ll help you understand your options.',
  },
  {
    q: 'What if there are multiple heirs?',
    a: 'We regularly work with families. All heirs must agree to sell, but we help coordinate the process.',
  },
  {
    q: 'Who pays for repairs or back taxes?',
    a: 'We buy the house as-is. We can often cover or work around back taxes as part of the offer.',
  },
  {
    q: 'How long does the whole process take?',
    a: 'It depends on probate status, but many inherited property deals close in 14–45 days.',
  },
];

const AREA_GROUPS = [
  { county: 'Lane County', cities: 'Eugene · Springfield · Florence · Cottage Grove', icon: '🌲' },
  { county: 'Benton County', cities: 'Corvallis · Philomath · Monroe', icon: '🎓' },
  { county: 'Douglas County', cities: 'Roseburg · Sutherlin · Myrtle Creek', icon: '⛰️' },
  { county: 'Deschutes County', cities: 'Bend · Redmond · Sisters · La Pine', icon: '🏔️' },
  { county: 'Linn County', cities: 'Albany · Lebanon · Sweet Home', icon: '🌾' },
];

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'NW Investor Real Estate',
  url: SITE_URL,
  telephone: '+1-541-321-2630',
  areaServed: cities.map((c) => ({ '@type': 'City', name: c.name })),
};

export default function HomePage() {
  const [offerForm, setOfferForm] = useState({ name: '', email: '', phone: '', address: '', details: '' });
  const [offerSent, setOfferSent] = useState(false);

  const submitOffer = (e) => {
    e.preventDefault();
    setOfferSent(true);
  };

  return (
    <>
      <SeoHead
        title="NW Investor | We Buy Houses Fast in Eugene, Springfield & Oregon"
        description="NW Investor buys houses fast in Eugene, Springfield, Corvallis, Roseburg, Bend, and across Oregon. Cash offers on inherited, probate, and as-is homes. Close in 14–45 days."
        path="/"
        jsonLd={orgJsonLd}
      />

      <section className={home.hero}>
        <video className={home.heroBg} autoPlay muted loop playsInline poster={images.hero}>
          <source src={images.video} type="video/mp4" />
        </video>
        <img src={images.hero} alt="" className={home.heroBg} style={{ display: 'none' }} aria-hidden />
        <div className={home.heroOverlay} />
        <div className={`${layout.container} ${home.heroContent}`}>
          <div className={home.heroBadge}>● Oregon&apos;s Trusted Cash Buyer</div>
          <h1 className={home.heroTitle}>
            We Buy Houses <span>Fast. Fair. As-Is.</span>
          </h1>
          <p className={home.heroSub}>
            Inherited a property? Need to sell quickly? No repairs. No commissions. No hassle. Close in
            as little as 14 days.
          </p>
          <div className={layout.ctaRow}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Instant Cash Calculator →
            </Link>
            <a href="#offer" className={layout.ctaSecondary}>
              Get My Cash Offer
            </a>
            <a href={`tel:${PHONE_TEL}`} className={layout.ctaSecondary}>
              {PHONE_DISPLAY}
            </a>
          </div>
          <div className={home.heroStats}>
            <div className={home.heroStat}>
              <strong>14–45</strong>
              <span>days to close</span>
            </div>
            <div className={home.heroStat}>
              <strong>As-Is</strong>
              <span>no repairs needed</span>
            </div>
            <div className={home.heroStat}>
              <strong>$0</strong>
              <span>fees or commissions</span>
            </div>
          </div>
        </div>
      </section>

      <section className={home.calcBanner}>
        <div className={layout.container} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <strong style={{ color: 'var(--nw-teal)', fontSize: 12, letterSpacing: '0.1em' }}>
              NEW — INSTANT ESTIMATE
            </strong>
            <h2 style={{ margin: '8px 0', fontSize: 24 }}>How much is your house worth in cash?</h2>
            <p style={{ margin: 0, color: 'var(--nw-muted)' }}>
              Use our calculator for market value and cash offer ranges before you call.
            </p>
          </div>
          <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
            Open Cash Offer Calculator →
          </Link>
        </div>
      </section>

      <section id="how-it-works" className={layout.section}>
        <div className={layout.container}>
          <p className={layout.sectionLabel}>Simple Process</p>
          <h2 className={layout.sectionTitle}>How We Buy Your House</h2>
          <p className={layout.sectionSub}>Three steps from contact to cash in hand.</p>
          <div className={home.stepsGrid}>
            {[
              ['01', '📞', 'Tell Us About the House', 'Call or use the form. Share the address and situation — probate, inherited, taxes, or need to sell fast.'],
              ['02', '💰', 'Receive a Cash Offer', 'Fair, no-obligation offer usually within 24–48 hours. No agents or lowball games.'],
              ['03', '🏦', 'Close & Get Paid', 'Title handles heirship or probate coordination. Cash on closing day.'],
            ].map(([num, icon, title, text]) => (
              <div key={num} className={home.stepCard}>
                <div className={home.stepNum}>{num}</div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>{title}</h3>
                <p style={{ margin: 0, color: 'var(--nw-muted)', lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${layout.section} ${home.inheritSection}`}>
        <div className={layout.container}>
          <div className={home.inheritGrid}>
            <div>
              <p className={layout.sectionLabel}>Why NW Investor</p>
              <h2 className={layout.sectionTitle}>We Specialize in Inherited Properties</h2>
              <p className={layout.sectionSub}>
                Dealing with an inherited property is emotionally and legally complex. We work with
                families navigating probate, heirship affidavits, and multiple heirs every day.
              </p>
              <ul className={home.checkList}>
                <li>Buy as-is — no repairs or clean-out required</li>
                <li>Work with Small Estate & Heirship Affidavits</li>
                <li>Coordinate with your title company or ours</li>
                <li>Back taxes paid or worked into offer</li>
                <li>Multiple heirs? We help coordinate</li>
                <li>Close in 14–45 days depending on probate status</li>
              </ul>
              <div className={layout.ctaRow}>
                <a href={`tel:${PHONE_TEL}`} className={layout.ctaPrimary}>
                  Call {PHONE_DISPLAY}
                </a>
                <Link to="/probate-inherited-house-guide" className={layout.ctaSecondary}>
                  Probate Guide →
                </Link>
              </div>
            </div>
            <ResponsiveImage
              candidates={[images.seller, images.sellerAlt]}
              alt="Happy Oregon home seller after cash sale"
            />
          </div>
        </div>
      </section>

      <section id="areas" className={layout.section}>
        <div className={layout.container}>
          <p className={layout.sectionLabel}>Service Area</p>
          <h2 className={layout.sectionTitle}>We Buy Across Western Oregon</h2>
          <p className={layout.sectionSub}>
            From the Willamette Valley to the Oregon Coast and Central Oregon.
          </p>
          <div className={home.areasGrid}>
            {AREA_GROUPS.map((a) => (
              <div key={a.county} className={home.areaCard}>
                <div className={home.areaIcon}>{a.icon}</div>
                <strong>{a.county}</strong>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--nw-muted)' }}>{a.cities}</p>
              </div>
            ))}
          </div>
          <div className={home.areasGrid} style={{ marginTop: 24 }}>
            {cities.map((c) => (
              <Link key={c.slug} to={`/we-buy-houses/${c.slug}`} className={home.areaCard}>
                <strong>We Buy Houses — {c.name}</strong>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--nw-teal)' }}>Local cash buyer →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={layout.section} style={{ background: 'var(--nw-surface)' }}>
        <div className={layout.container}>
          <div className={home.faqGrid}>
            <div>
              <p className={layout.sectionLabel}>Common Questions</p>
              <h2 className={layout.sectionTitle}>Inherited Property FAQ</h2>
              <p className={layout.sectionSub}>
                Answers to questions we hear about inherited and probate properties in Oregon.
              </p>
              <Link to="/selling-vs-cash-offer" className={layout.ctaSecondary} style={{ marginTop: 16, display: 'inline-flex' }}>
                Cash vs listing comparison →
              </Link>
            </div>
            <div>
              {FAQ.map((item) => (
                <div key={item.q} className={home.faqItem}>
                  <div className={home.faqQ}>{item.q}</div>
                  <div className={home.faqA}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="offer" className={`${layout.section} ${home.offerSection}`}>
        <div className={layout.container} style={{ textAlign: 'center' }}>
          <h2 className={layout.sectionTitle}>Ready to Move Forward?</h2>
          <p className={layout.sectionSub} style={{ margin: '0 auto' }}>
            Inherited property in Eugene, Springfield, Corvallis, Roseburg, Bend, Florence, or anywhere
            in our counties — we can help.
          </p>
          <p style={{ fontSize: 20, fontWeight: 700 }}>
            <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
          </p>
          {offerSent ? (
            <div className={home.formBox}>
              <p style={{ color: 'var(--nw-green)', fontWeight: 700 }}>Thank you — we&apos;ll respond within 24 hours.</p>
              <p style={{ color: 'var(--nw-muted)', fontSize: 14 }}>
                For immediate help, call {PHONE_DISPLAY}.
              </p>
            </div>
          ) : (
            <form className={home.formBox} onSubmit={submitOffer}>
              <div className={home.formRow}>
                <label htmlFor="name">Name</label>
                <input id="name" required value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} />
              </div>
              <div className={home.formRow}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={offerForm.email} onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })} />
              </div>
              <div className={home.formRow}>
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" required value={offerForm.phone} onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })} />
              </div>
              <div className={home.formRow}>
                <label htmlFor="address">Property address</label>
                <input id="address" value={offerForm.address} onChange={(e) => setOfferForm({ ...offerForm, address: e.target.value })} />
              </div>
              <div className={home.formRow}>
                <label htmlFor="details">Situation (optional)</label>
                <textarea id="details" rows={3} value={offerForm.details} onChange={(e) => setOfferForm({ ...offerForm, details: e.target.value })} />
              </div>
              <button type="submit" className={layout.ctaPrimary} style={{ width: '100%', justifyContent: 'center' }}>
                Get My No-Obligation Cash Offer →
              </button>
              <p className={layout.disclaimer}>No spam. No pressure. We respond within 24 hours.</p>
            </form>
          )}
        </div>
      </section>

      <section id="investors" className={layout.section}>
        <div className={layout.container}>
          <p className={layout.sectionLabel}>Investor Portal</p>
          <h2 className={layout.sectionTitle}>Partner With NW Investor</h2>
          <div className={layout.grid2}>
            <div className={layout.card}>
              <h3>Become an Investor Partner</h3>
              <p style={{ color: 'var(--nw-muted)' }}>
                Join our private network for motivated seller leads and JV opportunities across Lane,
                Benton, Linn, and Douglas counties.
              </p>
              <a href="#offer" className={layout.ctaSecondary}>Join the Investor Network →</a>
            </div>
            <div className={layout.card}>
              <h3>🗺 Live Zoning Data — Map CMS</h3>
              <p style={{ color: 'var(--nw-muted)' }}>
                Investor map with zoning overlays and property intelligence. Separate from this
                marketing site — does not affect public SEO pages.
              </p>
              <Link to="/app" className={layout.ctaPrimary}>
                Launch the Map CMS →
              </Link>
              <ResponsiveImage
                candidates={[images.mapApp, images.mapInv]}
                alt="NW Investor map application"
                style={{ marginTop: 16, borderRadius: 12 }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
