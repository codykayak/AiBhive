import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SiteLayout from './marketing/layout/SiteLayout';
import HomePage from './marketing/pages/HomePage';
import CashOfferCalculator from './marketing/pages/CashOfferCalculator';
import CityWeBuyHouses from './marketing/pages/CityWeBuyHouses';
import SellingVsCash from './marketing/pages/SellingVsCash';
import ProbateGuide from './marketing/pages/ProbateGuide';
import Testimonials from './marketing/pages/Testimonials';

const MapApp = lazy(() => import('./map/MapApp'));

function MapLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#070d14',
        color: '#8b949e',
      }}
    >
      Loading Map CMS…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cash-offer-calculator" element={<CashOfferCalculator />} />
          <Route path="we-buy-houses/:citySlug" element={<CityWeBuyHouses />} />
          <Route path="selling-vs-cash-offer" element={<SellingVsCash />} />
          <Route path="probate-inherited-house-guide" element={<ProbateGuide />} />
          <Route path="testimonials" element={<Testimonials />} />
        </Route>

        <Route
          path="app/*"
          element={
            <Suspense fallback={<MapLoading />}>
              <MapApp />
            </Suspense>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
