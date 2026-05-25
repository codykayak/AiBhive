import { Link } from 'react-router-dom';
import { images, PHONE_DISPLAY, PHONE_TEL } from '../utils/templateImages';
import { cities } from '../data/cities';
import footer from './footer.module.css';
import layout from '../layout/site-layout.module.css';

export default function Footer() {
  return (
    <footer className={footer.footer}>
      <div className={`${layout.container} ${footer.grid}`}>
        <div>
          <img src={images.logo} alt="NW Investor" className={footer.logo} />
          <p style={{ color: 'var(--nw-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
            Oregon cash home buyer specializing in inherited, probate, and as-is properties across
            Lane, Benton, Douglas, Deschutes, and Linn counties.
          </p>
        </div>

        <div className={footer.col}>
          <div className={footer.colTitle}>Sell Your Home</div>
          <Link to="/cash-offer-calculator">Instant Cash Calculator</Link>
          <Link to="/selling-vs-cash-offer">Cash vs Traditional Sale</Link>
          <Link to="/probate-inherited-house-guide">Probate & Inherited Guide</Link>
          <Link to="/testimonials">Testimonials & Case Studies</Link>
          <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
        </div>

        <div className={footer.col}>
          <div className={footer.colTitle}>We Buy Houses</div>
          {cities.map((c) => (
            <Link key={c.slug} to={`/we-buy-houses/${c.slug}`}>
              {c.name}, OR
            </Link>
          ))}
        </div>

        <div className={footer.col}>
          <div className={footer.colTitle}>Investors</div>
          <Link to="/app">Map CMS (Investors)</Link>
          <a href="/#investors">Partner Program</a>
          <a href="/#offer">Get Cash Offer</a>
        </div>
      </div>

      <div className={layout.container}>
        <div className={footer.bottom}>
          <span>© {new Date().getFullYear()} NW Investor Real Estate. All rights reserved.</span>
          <span>Oregon · Not a solicitation where prohibited.</span>
        </div>
      </div>
    </footer>
  );
}
