import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { images, PHONE_DISPLAY, PHONE_TEL } from '../utils/templateImages';
import nav from './navbar.module.css';

const marketingLinks = [
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#areas', label: 'Areas' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/testimonials', label: 'Reviews' },
  { to: '/probate-inherited-house-guide', label: 'Probate Guide' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const hashLink = (hash) => (isHome ? hash : `/${hash}`);

  return (
    <>
      <nav className={nav.nav}>
        <Link to="/" className={nav.navLogo} onClick={() => setOpen(false)}>
          <img src={images.logo} alt="NW Investor" />
        </Link>

        <div className={nav.navLinks}>
          {marketingLinks.map(({ to, label }) => (
            <a
              key={to}
              href={isHome ? to.replace('/', '') : to}
              className={nav.navLink}
            >
              {label}
            </a>
          ))}
          <Link to="/selling-vs-cash-offer" className={nav.navLink}>
            Cash vs Listing
          </Link>
        </div>

        <div className={nav.navActions}>
          <a href={`tel:${PHONE_TEL}`} className={nav.callBtn}>
            {PHONE_DISPLAY}
          </a>
          <Link to="/cash-offer-calculator" className={nav.calcBtn}>
            Cash Calculator
          </Link>
          <Link to="/#offer" className={nav.offerBtn}>
            Get Cash Offer
          </Link>
          <button
            type="button"
            className={nav.mapBtn}
            onClick={() => navigate('/app')}
          >
            Map CMS →
          </button>
          <button
            type="button"
            className={nav.hamburger}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {open && (
        <div className={nav.mobileMenu}>
          {marketingLinks.map(({ to, label }) => (
            <a
              key={to}
              href={hashLink(to.replace('/', ''))}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <Link to="/cash-offer-calculator" onClick={() => setOpen(false)}>
            Instant Cash Calculator
          </Link>
          <Link to="/selling-vs-cash-offer" onClick={() => setOpen(false)}>
            Selling vs Cash Offer
          </Link>
          <Link to="/#offer" onClick={() => setOpen(false)}>
            Get Cash Offer
          </Link>
          <button type="button" className={nav.mapBtn} onClick={() => { setOpen(false); navigate('/app'); }}>
            Map CMS →
          </button>
        </div>
      )}
    </>
  );
}
