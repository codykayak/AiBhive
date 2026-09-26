import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { RvMatcher } from '../../components/rv/RvMatcher';
import { RV_EMBED_SCRIPT_SNIPPET } from '../../content/rvSiteContent';
import { SITE_URL } from '../../constants/site';

export default function RvDemoPage() {
  const embedSnippet = `<iframe
  src="${SITE_URL}/rv/embed"
  title="RV match assistant"
  style="width:100%;min-height:640px;border:0;border-radius:16px;"
  loading="lazy"
></iframe>`;

  return (
    <main className="relative pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
      <SEO
        title="Camping World RV Match Demo | AiBhive"
        description="Try the AiBhive RV shopper AI: describe your budget, tow vehicle, and travel style. Demo inventory styled after Camping World floor stock."
        keywords="Camping World RV finder, RV AI assistant, tow capacity RV match"
      />

      <div className="mb-10">
        <p className="text-bee-amber text-sm font-semibold uppercase tracking-widest mb-2">Live demo</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Camping World–style match assistant
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Sample units and payments for illustration only — not affiliated with Camping World. When we
          onboard a real partner, this same UI reads their DMS or inventory feed.
        </p>
        <Link to="/rv" className="text-sm text-bee-amber hover:underline mt-2 inline-block">
          ← Back to RV overview
        </Link>
      </div>

      <RvMatcher />

      <section className="mt-16 rounded-2xl border border-white/10 bg-black/30 p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-2">Install on a dealer website</h2>
        <p className="text-sm text-slate-400 mb-4">
          Drop this iframe into WordPress, DealerSocket sites, or any HTML block. Customize height and
          border radius to match brand.
        </p>
        <pre className="text-xs text-slate-300 bg-black/50 rounded-xl p-4 overflow-x-auto border border-white/10">
          {embedSnippet}
        </pre>
        <p className="text-xs text-slate-500 mt-3 mb-6">
          Enterprise: swap <code className="text-slate-400">/rv/embed</code> for a tenant-specific URL with
          your inventory API key (coming soon).
        </p>
        <h3 className="text-sm font-bold text-white mb-2">Script embed (optional)</h3>
        <pre className="text-xs text-slate-300 bg-black/50 rounded-xl p-4 overflow-x-auto border border-white/10">
          {`<div id="aibhive-rv"></div>\n<script>${RV_EMBED_SCRIPT_SNIPPET}</script>`}
        </pre>
        <p className="text-xs text-slate-500 mt-4">
          <Link to="/rv/inventory" className="text-bee-amber hover:underline">Browse the demo catalog</Link>
          {' · '}
          <Link to="/rv/enterprise" className="text-bee-amber hover:underline">Enterprise pilot</Link>
        </p>
      </section>
    </main>
  );
}
