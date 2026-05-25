import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { SITE_URL } from '../utils/templateImages';
import layout from '../layout/site-layout.module.css';

export default function SellingVsCash() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Selling on the MLS vs Accepting a Cash Offer in Oregon',
    author: { '@type': 'Organization', name: 'NW Investor Real Estate' },
    url: `${SITE_URL}/selling-vs-cash-offer`,
  };

  return (
    <>
      <SeoHead
        title="Selling vs Cash Offer | Oregon Home Seller Guide | NW Investor"
        description="Honest comparison of listing your Oregon home on the MLS vs selling for cash to an investor. Costs, timelines, risks, and when each path fits."
        path="/selling-vs-cash-offer"
        keywords="sell house cash vs realtor Oregon, MLS vs cash offer, cost to sell house Eugene"
        jsonLd={jsonLd}
      />

      <section className={layout.section}>
        <div className={`${layout.container} ${layout.prose}`}>
          <p className={layout.breadcrumb}>
            <Link to="/">Home</Link> / Selling vs Cash Offer
          </p>
          <p className={layout.sectionLabel}>Seller Guide</p>
          <h1 className={layout.sectionTitle}>Listing on the MLS vs Selling for Cash</h1>
          <p className={layout.sectionSub}>
            Both paths can be legitimate — but they serve different sellers. This guide explains
            trade-offs so you can choose what fits your timeline, property condition, and stress level.
          </p>

          <h2>Traditional MLS sale — advantages</h2>
          <ul>
            <li>
              <strong>Highest potential price</strong> when the home is updated, staged, and in a
              competitive micro-market — some buyers still pay near or above list in parts of Lane
              County for move-in-ready homes.
            </li>
            <li>
              <strong>Wide exposure</strong> through MLS, Zillow, and agent networks.
            </li>
            <li>
              <strong>Good for patient sellers</strong> with a property that will pass inspection and
              appraise cleanly.
            </li>
          </ul>

          <h2>Traditional MLS sale — disadvantages</h2>
          <ul>
            <li>
              <strong>6%+ typical commission</strong> plus seller-paid closing costs, staging, and
              pre-list repairs.
            </li>
            <li>
              <strong>45–90+ day timeline</strong> is common — longer for dated homes, unique
              properties, or slow seasons (Coast and rural Douglas County often take longer).
            </li>
            <li>
              <strong>Financing fall-through risk</strong> — buyers renegotiate after inspection; deals
              die over appraisal gaps.
            </li>
            <li>
              <strong>Showings and privacy loss</strong> — difficult during probate, tenant occupancy,
              or if you live out of state.
            </li>
            <li>
              <strong>No guarantee of net proceeds</strong> until closing — holding costs, price
              reductions, and repair credits add up.
            </li>
          </ul>

          <h2>Cash offer from NW Investor — advantages</h2>
          <ul>
            <li>
              <strong>Speed:</strong> many closings in 14–45 days depending on title/heirship.
            </li>
            <li>
              <strong>As-is:</strong> no contractor bids, no open-house prep, often no clean-out requirement.
            </li>
            <li>
              <strong>Certainty:</strong> no buyer loan contingency; we use cash or hard-money lines
              structured for investment purchases.
            </li>
            <li>
              <strong>Lower friction for hard situations:</strong> inherited homes, multiple heirs,
              back taxes, tenant-occupied, or properties that will not pass retail inspection.
            </li>
            <li>
              <strong>We handle paperwork coordination</strong> with Oregon title companies experienced
              in affidavits of heirship and small-estate processes where applicable.
            </li>
          </ul>

          <h2>Cash offer — disadvantages</h2>
          <ul>
            <li>
              <strong>Lower gross price than retail</strong> — investors account for repairs, holding,
              resale risk, and margin. You trade maximum price for speed and convenience.
            </li>
            <li>
              <strong>Not ideal for pristine homes in peak spring markets</strong> if you have 3+ months
              and want every retail dollar.
            </li>
            <li>
              <strong>Verify your buyer</strong> — work with a local, licensed team that closes through
              a reputable title company (we do).
            </li>
          </ul>

          <h2>Side-by-side snapshot</h2>
          <div className={layout.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--nw-border)' }}>
                  <th style={{ padding: '10px 8px' }}>Factor</th>
                  <th style={{ padding: '10px 8px' }}>MLS listing</th>
                  <th style={{ padding: '10px 8px' }}>Cash to NW Investor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Timeline', 'Often 60–120 days', 'Often 14–45 days'],
                  ['Repairs', 'Usually required', 'None required (as-is)'],
                  ['Commissions', '~5–6% typical', 'None'],
                  ['Showings', 'Many', 'None'],
                  ['Buyer financing risk', 'Yes', 'No'],
                  ['Best for', 'Updated, move-in ready', 'Inherited, distressed, urgent'],
                ].map(([a, b, c]) => (
                  <tr key={a} style={{ borderBottom: '1px solid var(--nw-border)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--nw-text)' }}>{a}</td>
                    <td style={{ padding: '10px 8px' }}>{b}</td>
                    <td style={{ padding: '10px 8px' }}>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Which path is right for you?</h2>
          <p>
            If your home is market-ready and you are not under time pressure, interviewing 2–3 agents
            may maximize price. If you are facing probate, code issues, tenant drama, or simply need
            to be done — a vetted cash buyer is often the rational choice.
          </p>

          <div className={layout.ctaRow}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Try the Cash Calculator →
            </Link>
            <a href="/#offer" className={layout.ctaSecondary}>
              Request a Formal Offer
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
