import { Link } from 'react-router-dom';
import ResponsiveImage from './ResponsiveImage';
import { calculatorImageCandidates } from '../utils/templateImages';
import promo from './cash-offer-promo.module.css';
import layout from '../layout/site-layout.module.css';

/** Shown on every marketing page — links to the cash offer calculator. */
export default function CashOfferPromo({ compact = false }) {
  return (
    <section className={promo.promo} aria-labelledby="cash-promo-title">
      <div className={`${layout.container} ${promo.promoInner}`}>
        <ResponsiveImage
          candidates={calculatorImageCandidates()}
          alt="Instant cash offer calculator for Oregon homeowners"
          className={promo.promoImage}
        />
        <div>
          <p className={layout.sectionLabel}>Free Estimate Tool</p>
          <h2 id="cash-promo-title" className={promo.promoTitle}>
            How Much Could You Get for Your House in Cash?
          </h2>
          <p className={promo.promoText}>
            Use our instant cash offer calculator to see an estimated market value range and a
            realistic cash offer range — based on public property data and local investor margins.
            {compact ? '' : ' No obligation, no agent pressure.'}
          </p>
          <div className={promo.promoActions}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Open Cash Offer Calculator →
            </Link>
            <a href="/#offer" className={layout.ctaSecondary}>
              Speak to a Local Investor
            </a>
          </div>
          <p className={layout.disclaimer}>
            Estimates are based on available data, not a final appraisal or binding offer.
          </p>
        </div>
      </div>
    </section>
  );
}
