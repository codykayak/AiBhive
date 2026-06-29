import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { SEO } from '../../components/SEO';
import DirectAnswer from '../../components/DirectAnswer';
import { SITE_TAGLINE } from '../../constants/site';
import { TOOL_HUBS } from '../../data/toolsCatalog';

/** Public, text-rich index of AI tool categories — crawlable without login. */
export default function ToolsHubPage() {
  return (
    <main className="min-h-screen bg-bee-black pt-24 pb-20">
      <SEO
        title="AI Tools Directory — Public Guides | AiBhive"
        description={`${SITE_TAGLINE} Browse public category guides for real estate AI tools and how AiBhive builds or automates each workflow.`}
        keywords="AI tools directory, real estate AI tools, AiBhive tools, Bhive Builder, AI app categories"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-4">Public guides</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6">AI tool categories on AiBhive</h1>

        <DirectAnswer>
          {SITE_TAGLINE} These pages list intent-based AI tool categories (starting with real estate) with
          plain-English answers so you and AI search engines can see what AiBhive builds—no app login required.
        </DirectAnswer>

        <ul className="space-y-4 mt-10">
          {TOOL_HUBS.map((hub) => (
            <li key={hub.slug}>
              <Link
                to={hub.href}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-bee-amber/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-bee-amber/15 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-6 h-6 text-bee-amber" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-white font-bold text-lg group-hover:text-bee-amber transition-colors">
                    {hub.title}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{hub.description}</p>
                  <p className="text-slate-500 text-xs mt-2">{hub.categories} categories · updated on-site</p>
                </div>
                <ArrowRight className="w-5 h-5 text-bee-amber shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-slate-500 text-sm mt-12 leading-relaxed">
          Want a custom tool instead of browsing categories?{' '}
          <Link to="/hive-apps/build" className="text-bee-amber font-semibold hover:underline">
            Describe it to Bhive Builder
          </Link>{' '}
          or explore{' '}
          <Link to="/hive-apps" className="text-bee-amber font-semibold hover:underline">
            Hive Apps
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
