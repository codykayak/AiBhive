import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { RV_DEALER_SYSTEMS, RV_ENTERPRISE_BULLETS } from '../../content/rvEnterprise';
import { RV_PACKAGES, RV_PERSONAS } from '../../content/rvSiteContent';
import { RvEnterpriseLeadForm } from '../../components/rv/RvEnterpriseLeadForm';
import { RvFaq } from '../../components/rv/RvFaq';
import { SITE_URL } from '../../constants/site';

export default function RvEnterprisePage() {
  return (
    <main className="relative pb-24">
      <SEO
        title="RV Dealer Enterprise — DMS Integration & AI Widget | AiBhive"
        description="Wholesale and dealer-group rollout for RV AI: IDS Astra, Lightspeed, inventory feeds, CRM handoff, and white-label embed."
        jsonLd={{
          '@type': 'WebPage',
          name: 'AiBhive RV Enterprise',
          url: `${SITE_URL}/rv/enterprise`,
        }}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <Link to="/rv" className="text-sm text-bee-amber hover:underline">← RV home</Link>
        <h1 className="text-4xl font-extrabold text-white mt-4 mb-4">Enterprise & wholesale</h1>
        <p className="text-slate-400 max-w-3xl text-lg">
          Deploy one shopper-AI layer across every rooftop. Inventory stays in your DMS; AiBhive handles match
          logic, disclosures, and lead routing.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-3 gap-6">
        {RV_PERSONAS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <h2 className="font-bold text-white mb-4">{p.title}</h2>
            <ul className="space-y-2 text-sm text-slate-400">
              {p.points.map((pt) => (
                <li key={pt}>• {pt}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="border-y border-white/10 bg-black/40 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why groups choose AiBhive RV</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            {RV_ENTERPRISE_BULLETS.map((b) => (
              <li key={b} className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">{b}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Packages</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {RV_PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                pkg.highlighted
                  ? 'border-bee-amber/40 bg-bee-amber/5'
                  : 'border-white/10 bg-black/25'
              }`}
            >
              <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
              <p className="text-bee-amber font-semibold my-2">{pkg.price}</p>
              <p className="text-sm text-slate-400 mb-4 flex-grow">{pkg.blurb}</p>
              <ul className="text-xs text-slate-300 space-y-2">
                {pkg.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Integration map</h2>
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
            {RV_DEALER_SYSTEMS.map((sys) => (
              <div key={sys.id} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-emerald-400 uppercase">{sys.category}</p>
                <p className="font-semibold text-white">{sys.name}</p>
                <p className="text-xs text-slate-400 mt-1">{sys.aiBhiveRole}</p>
              </div>
            ))}
          </div>
        </div>
        <RvEnterpriseLeadForm />
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">FAQ</h2>
        <RvFaq />
      </section>
    </main>
  );
}
