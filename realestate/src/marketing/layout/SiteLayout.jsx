import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CashOfferPromo from '../components/CashOfferPromo';
import layout from './site-layout.module.css';

/** Marketing shell only — map app uses a separate route tree without this layout. */
export default function SiteLayout({ showCalculatorPromo = true }) {
  return (
    <div className={layout.page}>
      <Navbar />
      <main style={{ paddingTop: 68 }}>
        <Outlet />
        {showCalculatorPromo && <CashOfferPromo />}
      </main>
      <Footer />
    </div>
  );
}
