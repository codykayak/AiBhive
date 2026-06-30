import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Download,
  Radar,
  Megaphone,
  Search,
  Share2,
  Sparkles,
  Wand2,
  LayoutGrid,
} from 'lucide-react';
import { fetchStoreCatalog } from '../lib/hiveStoreApi';
import { EXAMPLE_TOOLS, EXAMPLE_APP_IDS } from '../lib/hiveExampleApps';
import type { HiveAppSpec } from '../lib/hiveAppTypes';
import HiveAppCard, { HiveAppCardSkeleton } from './hive-apps/HiveAppCard';

const COMMUNITY_STEPS = [
  { n: '1', title: 'Install free', body: 'Browse the community pool — grab any shared app instantly.' },
  { n: '2', title: 'Tweak it', body: 'Quick edits in seconds (~$0.50). Your data stays on your device.' },
  { n: '3', title: 'Share back', body: 'Opt in when you love it. The hive grows smarter for everyone.' },
];

const EXAMPLE_TOOL_ICONS = {
  [EXAMPLE_APP_IDS.jobHunter]: Search,
  [EXAMPLE_APP_IDS.socialPostHunter]: Megaphone,
  [EXAMPLE_APP_IDS.jobTracker]: Briefcase,
  [EXAMPLE_APP_IDS.resumeBot]: Sparkles,
  [EXAMPLE_APP_IDS.research]: Radar,
  [EXAMPLE_APP_IDS.mockRealestate]: Building2,
} as const;

const PILLARS = [
  { title: 'Do', sub: 'Auto-Bot Resume & job tools', icon: Sparkles, href: `/hive-apps/run/${EXAMPLE_APP_IDS.resumeBot}` },
  { title: 'Build', sub: 'Bhive Builder — apps from plain English', icon: Wand2, href: '/hive-apps/build' },
  { title: 'Research', sub: 'AI-directed OSINT on any target', icon: Radar, href: `/hive-apps/run/${EXAMPLE_APP_IDS.research}` },
];

export default function HomeHivePlatform() {
  const [appCount, setAppCount] = useState<number | null>(null);
  const [featured, setFeatured] = useState<HiveAppSpec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreCatalog({ limit: 6 })
      .then((catalog) => {
        const examples = catalog.examples || [];
        setAppCount(catalog.total || examples.length);
        setFeatured(
          (catalog.featured.length ? catalog.featured : examples).slice(0, 3)
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative bg-[#070a0f] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8 md:mb-10"
        >
          <div className="w-12 h-12 rounded-2xl bg-bee-amber flex items-center justify-center">
            <LayoutGrid className="w-6 h-6 text-bee-black" />
          </div>
          <div>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-widest">AiBhive Mobile</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Your app factory & community pool
            </h2>
          </div>
        </motion.div>

        {/* Top row: $1–$5 + community steps — desktop side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full"
          >
            <Link
              to="/hive-apps/build"
              className="block w-full h-full min-h-[220px] rounded-2xl md:rounded-3xl bg-bee-amber p-8 md:p-10 hover:bg-bee-yellow transition-colors group"
            >
              <p className="text-bee-black/70 text-xs md:text-sm font-bold uppercase tracking-widest">
                Your first app
              </p>
              <p className="text-bee-black text-5xl md:text-6xl lg:text-7xl font-black mt-2 tracking-tight">
                $1 to $5
              </p>
              <p className="text-bee-black/85 text-base md:text-lg mt-4 max-w-md leading-relaxed">
                Describe any tool in plain English — live on your phone in under a minute. No Play Store
                update. Tweak for ~$0.50. Full customize from ~$4.
              </p>
              <span className="inline-flex items-center gap-2 mt-6 md:mt-8 text-bee-black font-extrabold bg-black/10 px-5 py-3 rounded-xl group-hover:bg-black/15 transition-colors">
                <Sparkles className="w-5 h-5" />
                Build from scratch
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          </motion.div>

          <div className="flex flex-col gap-3 md:gap-4 h-full">
            <div className="flex items-center gap-2 px-1 mb-1">
              <Share2 className="w-5 h-5 text-bee-amber" />
              <p className="text-white font-bold text-lg">Community app pool</p>
            </div>
            {COMMUNITY_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to="/hive-apps"
                  className="w-full flex items-center gap-4 md:gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 hover:border-bee-amber/30 hover:bg-white/[0.05] transition-all flex-1"
                >
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-bee-amber/15 flex items-center justify-center shrink-0">
                    <span className="text-bee-amber font-black text-xl">{step.n}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-base md:text-lg">{step.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 shrink-0 hidden sm:block" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Do · Build · Research — three full-width blocks on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            const inner = (
              <>
                <Icon className="w-7 h-7 text-bee-amber shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-black text-xl">{p.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{p.sub}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 shrink-0" />
              </>
            );
            const className =
              'w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 hover:border-bee-amber/25 transition-colors';

            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {p.href.startsWith('/') ? (
                  <Link to={p.href} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <a href={p.href} className={className}>
                    {inner}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Example tools */}
        <div className="mb-8 md:mb-10">
          <h3 className="text-white font-bold text-lg md:text-xl mb-4 px-1">Example tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {EXAMPLE_TOOLS.map((tool) => {
              const Icon = EXAMPLE_TOOL_ICONS[tool.id as keyof typeof EXAMPLE_TOOL_ICONS] ?? Sparkles;
              return (
                <Link
                  key={tool.id}
                  to={`/hive-apps/run/${tool.id}`}
                  className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 hover:border-bee-amber/30 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-bee-amber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold">{tool.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{tool.sub}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-bee-amber shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Community apps preview */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 px-1">
            <div>
              <h3 className="text-white font-bold text-lg md:text-xl">From the community</h3>
              <p className="text-slate-500 text-sm mt-1">
                {loading
                  ? 'Loading toolkit…'
                  : appCount
                    ? `${appCount} shared app${appCount === 1 ? '' : 's'} — install free, try in browser`
                    : 'The pool is warming up — be the first to share an app you love'}
              </p>
            </div>
            <Link
              to="/hive-apps"
              className="inline-flex items-center gap-2 text-bee-amber font-bold text-sm hover:underline shrink-0"
            >
              Browse Hive Apps
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[0, 1, 2].map((i) => (
                <HiveAppCardSkeleton key={i} />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {featured.map((app) => (
                <HiveAppCard key={app.id} app={app} variant="mobile" runDirect={app.isExample} />
              ))}
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-white/10 p-10 md:p-14 text-center">
              <p className="text-white font-bold text-lg">Your app could be here</p>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Build in AiBhive, use it until you love it, then share to the community toolkit.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Link
                  to="/hive-apps/build"
                  className="px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-bold text-sm"
                >
                  Build your first app
                </Link>
                <a
                  href="https://aibhive.com/api/download/apk"
                  className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold text-sm"
                >
                  Download AiBhive
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Full-width CTA strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Link
            to="/hive-apps"
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-bee-amber/10 border border-bee-amber/30 p-6 md:p-8 hover:bg-bee-amber/15 transition-colors"
          >
            <LayoutGrid className="w-6 h-6 text-bee-amber" />
            <span className="text-white font-extrabold text-lg">Open Hive Apps store</span>
            <ArrowRight className="w-5 h-5 text-bee-amber" />
          </Link>
          <a
            href="https://aibhive.com/api/download/apk"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 hover:border-bee-amber/30 transition-colors"
          >
            <Download className="w-6 h-6 text-bee-amber" />
            <span className="text-white font-extrabold text-lg">Get the Android app</span>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </a>
        </div>
      </div>
    </section>
  );
}
