import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { RvInventoryGrid } from '../../components/rv/RvInventoryGrid';
import { RV_DEMO_PARTNER } from '../../content/rvCampingWorldDemo';

export default function RvInventoryPage() {
  return (
    <main className="relative pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
      <SEO
        title={`${RV_DEMO_PARTNER} Demo Inventory | AiBhive RV`}
        description="Browse demo RV units with tow ratings, monthly estimates, and floorplan highlights. Pair with the AI matcher for personalized fit."
      />
      <p className="text-bee-amber text-sm font-semibold uppercase tracking-widest mb-2">Demo catalog</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{RV_DEMO_PARTNER}–style demo lot</h1>
      <p className="text-slate-400 max-w-2xl mb-6">
        Filter by type, payment, and tow capacity — then open the AI matcher for a guided recommendation.
      </p>
      <Link to="/rv" className="text-sm text-bee-amber hover:underline mb-10 inline-block">
        ← RV overview
      </Link>
      <RvInventoryGrid />
    </main>
  );
}
