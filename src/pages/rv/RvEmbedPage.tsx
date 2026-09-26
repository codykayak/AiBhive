import { SEO } from '../../components/SEO';
import { RvMatcher } from '../../components/rv/RvMatcher';

/** Minimal page for iframe embed on dealer sites — no site chrome when loaded via App shell rules. */
export default function RvEmbedPage() {
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white p-4 sm:p-6">
      <SEO title="RV Match Assistant" description="Embedded RV product matcher" />
      <div className="max-w-3xl mx-auto mb-4">
        <p className="text-xs text-slate-500">
          Powered by AiBhive · Demo inventory · Not a live dealer listing
        </p>
        <h1 className="text-lg font-bold text-white mt-1">Find your RV match</h1>
      </div>
      <div className="max-w-3xl mx-auto">
        <RvMatcher compact partnerLabel="Camping World demo" />
      </div>
    </div>
  );
}
