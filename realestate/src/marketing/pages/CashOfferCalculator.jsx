import { useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import ResponsiveImage from '../components/ResponsiveImage';
import { calculatorImageCandidates, PHONE_DISPLAY, PHONE_TEL, SITE_URL } from '../utils/templateImages';
import { estimateFromInputs, formatMoney } from '../utils/estimateValue';
import { cities } from '../data/cities';
import layout from '../layout/site-layout.module.css';
import calc from './calculator.module.css';

export default function CashOfferCalculator() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    condition: 'average',
    yearBuilt: '',
  });
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setResult(estimateFromInputs(form));
    setSubmitted(true);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NW Investor Instant Cash Offer Calculator',
    url: `${SITE_URL}/cash-offer-calculator`,
    applicationCategory: 'FinanceApplication',
    description:
      'Estimate your Oregon home market value range and cash offer range before speaking with a local investor.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <>
      <SeoHead
        title="Instant Cash Offer Calculator | NW Investor Oregon"
        description="Free Oregon cash home offer calculator. Enter your address for estimated market value and cash offer ranges. Eugene, Springfield, Bend, Corvallis & more."
        path="/cash-offer-calculator"
        keywords="cash offer calculator Oregon, home value estimate Eugene, sell house fast calculator"
        jsonLd={jsonLd}
      />

      <section className={calc.wrap}>
        <div className={layout.container}>
          <p className={layout.breadcrumb}>
            <Link to="/">Home</Link> / Cash Offer Calculator
          </p>
          <p className={layout.sectionLabel}>Instant Cash Offer Calculator</p>
          <h1 className={layout.sectionTitle}>Estimate Your Cash Offer Range</h1>
          <p className={layout.sectionSub}>
            Enter your property address or city, ZIP, and basics. We combine typical Oregon market
            data and investor purchase margins to show a realistic range — then you can speak with a
            local buyer for an accurate, no-obligation offer.
          </p>

          <div className={layout.grid2} style={{ marginTop: 32, alignItems: 'center' }}>
            <ResponsiveImage
              candidates={calculatorImageCandidates()}
              alt="Cash offer calculator for Oregon home sellers"
              className={calc.promoSideImg}
            />
            <ul className={layout.prose} style={{ margin: 0 }}>
              <li>Uses public-style property inputs (beds, baths, sqft, condition)</li>
              <li>Adjusts for Eugene, Springfield, Bend, Corvallis, and other service cities</li>
              <li>Cash range reflects as-is investor pricing — not retail list price</li>
            </ul>
          </div>

          <form className={calc.formCard} onSubmit={onSubmit}>
            <div className={calc.formGrid}>
              <div className={`${calc.field} ${calc.fieldFull}`}>
                <label className={calc.label} htmlFor="address">
                  Property street address (optional if city + ZIP provided)
                </label>
                <input
                  id="address"
                  className={calc.input}
                  name="address"
                  placeholder="123 Main St"
                  value={form.address}
                  onChange={update}
                />
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="city">
                  City *
                </label>
                <select id="city" className={calc.select} name="city" value={form.city} onChange={update} required>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Other Oregon">Other Oregon</option>
                </select>
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="zip">
                  ZIP code *
                </label>
                <input
                  id="zip"
                  className={calc.input}
                  name="zip"
                  placeholder="97401"
                  pattern="[0-9]{5}"
                  value={form.zip}
                  onChange={update}
                  required
                />
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="beds">
                  Bedrooms
                </label>
                <input id="beds" className={calc.input} name="beds" type="number" min="0" value={form.beds} onChange={update} />
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="baths">
                  Bathrooms
                </label>
                <input id="baths" className={calc.input} name="baths" type="number" min="0" step="0.5" value={form.baths} onChange={update} />
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="sqft">
                  Approx. sq ft
                </label>
                <input id="sqft" className={calc.input} name="sqft" type="number" min="0" value={form.sqft} onChange={update} />
              </div>
              <div className={calc.field}>
                <label className={calc.label} htmlFor="yearBuilt">
                  Year built
                </label>
                <input id="yearBuilt" className={calc.input} name="yearBuilt" type="number" value={form.yearBuilt} onChange={update} />
              </div>
              <div className={`${calc.field} ${calc.fieldFull}`}>
                <label className={calc.label} htmlFor="condition">
                  Property condition
                </label>
                <select id="condition" className={calc.select} name="condition" value={form.condition} onChange={update}>
                  <option value="excellent">Excellent / recently updated</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="fair">Fair — needs some work</option>
                  <option value="poor">Poor — major repairs needed</option>
                  <option value="needs-work">Needs significant work / hoarding / damage</option>
                </select>
              </div>
            </div>
            <div className={layout.ctaRow} style={{ marginTop: 24 }}>
              <button type="submit" className={layout.ctaPrimary}>
                Calculate My Estimate →
              </button>
            </div>
          </form>

          {submitted && result && (
            <div className={calc.results} role="region" aria-live="polite">
              <div className={calc.resultBox}>
                <div className={calc.resultLabel}>Estimated market value (range)</div>
                <div className={calc.resultValue}>
                  {formatMoney(result.marketLow)} – {formatMoney(result.marketHigh)}
                </div>
                <p className={calc.resultNote}>
                  Based on typical {result.cityDetected} area pricing and your property details. Not
                  an appraisal.
                </p>
              </div>
              <div className={calc.resultBox}>
                <div className={calc.resultLabel}>Estimated cash offer (range)</div>
                <div className={calc.resultValue}>
                  {formatMoney(result.cashLow)} – {formatMoney(result.cashHigh)}
                </div>
                <p className={calc.resultNote}>
                  Reflects as-is purchase, investor margin, and closing costs we typically cover.
                </p>
              </div>
              <div className={`${calc.ctaBox} ${calc.fieldFull}`} style={{ gridColumn: '1 / -1' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 24 }}>Get Your Accurate Cash Offer – Speak to a Local Investor</h2>
                <p style={{ color: 'var(--nw-muted)', marginBottom: 20 }}>
                  Ready for a real number? Call or submit your property — we respond within 24 hours.
                </p>
                <div className={layout.ctaRow} style={{ justifyContent: 'center' }}>
                  <a href={`tel:${PHONE_TEL}`} className={layout.ctaPrimary}>
                    Call {PHONE_DISPLAY}
                  </a>
                  <Link to="/#offer" className={layout.ctaSecondary}>
                    Request Formal Offer →
                  </Link>
                </div>
                <p className={layout.disclaimer}>
                  This is an estimate based on existing data and typical investor economics — not a
                  final comp, appraisal, or binding offer.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
