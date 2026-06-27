import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Key,
  Mic,
  Sparkles,
  Wand2,
  Shield,
  Zap,
  LayoutDashboard,
  Globe,
  Smartphone,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import {
  APP_STOCK_IMAGES,
  APP_TOPICS,
  APP_PILLARS,
  BYOK_FEATURES,
} from './appContent';
import { fetchStoreCatalog } from '../../lib/hiveStoreApi';
import HiveAppCard, { HiveAppCardSkeleton } from '../../components/hive-apps/HiveAppCard';
import type { HiveAppSpec } from '../../lib/hiveAppTypes';

const GALLERY = [
  { src: APP_STOCK_IMAGES.mobileApps, alt: 'Mobile app interfaces on phone', tag: 'Mobile apps' },
  { src: APP_STOCK_IMAGES.websiteDashboard, alt: 'Analytics website dashboard', tag: 'Web dashboards' },
  { src: APP_STOCK_IMAGES.adminPanel, alt: 'Admin command center on laptop', tag: 'Admin centers' },
  { src: APP_STOCK_IMAGES.webAppMock, alt: 'Modern web application', tag: 'Web apps' },
  { src: APP_STOCK_IMAGES.teamCollab, alt: 'Team collaborating on product', tag: 'Team tools' },
  { src: APP_STOCK_IMAGES.heroCommandCenter, alt: 'Data command center screens', tag: 'Command center' },
];

export default function AppHub() {
  const [featured, setFeatured] = useState<HiveAppSpec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreCatalog({ limit: 6 })
      .then((catalog) => {
        const pool = catalog.featured?.length ? catalog.featured : catalog.examples || [];
        setFeatured(pool.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="AiBhive App — Build Your AI Admin Command Center"
        description="No coding. Speak what you want — custom apps, admin panels, social automation, phone intelligence, and lead pipelines. BYOK or Hive credits. Works on aibhive.com/app and Android."
        keywords="AI app builder, admin command center, BYOK AI, no-code automation, AiBhive app, custom business tools"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img
            src={APP_STOCK_IMAGES.heroCommandCenter}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#050810]/90 to-[#050810]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bee-amber/10 border border-bee-amber/25 text-bee-amber text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Live on web & mobile
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
              Build your own{' '}
              <span className="text-bee-amber">admin command center.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl">
              No coding — just speak what you would like and we build it. Bring your own API keys or use
              ours. Custom apps, workflows, and automation hubs in seconds.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link
                to="/hive-apps/build"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-bee-amber text-bee-black font-extrabold text-base hover:bg-bee-yellow transition-colors shadow-[0_0_32px_rgba(245,158,11,0.25)]"
              >
                <Wand2 className="w-5 h-5" />
                Start building free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/5 text-white font-bold hover:border-bee-amber/40 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-bee-amber" />
                Open admin center
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14 max-w-4xl"
          >
            {[
              { icon: Mic, label: 'Speak it — we ship it' },
              { icon: Key, label: 'BYOK or Hive credits' },
              { icon: Zap, label: 'Apps in ~60 seconds' },
              { icon: Shield, label: 'Approval gates built-in' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col gap-2"
              >
                <Icon className="w-5 h-5 text-bee-amber" />
                <p className="text-white text-sm font-bold leading-snug">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BYOK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Your keys. <span className="text-bee-amber">Our stack.</span> Your choice.
            </h2>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Power users connect Grok, Gemini, or OpenAI directly. Everyone else can use AiBhive Tokens
              for cloud AI, search, and builds at API cost + 30%.
            </p>
            <div className="mt-8 space-y-4">
              {BYOK_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="text-white font-bold">{f.title}</p>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/3]">
            <img
              src={APP_STOCK_IMAGES.adminPanel}
              alt="Admin dashboard with analytics"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white font-black text-xl">Admin command center</p>
              <p className="text-slate-300 text-sm mt-1">Social · Phone · Leads · Custom ops — one hub</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-8">Do · Build · Research</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {APP_PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={p.href}
                  className="block h-full rounded-2xl border border-white/10 bg-[#070a0f] p-6 hover:border-bee-amber/35 transition-all group"
                >
                  <p className="text-bee-amber text-xs font-bold uppercase tracking-widest">{p.title}</p>
                  <p className="text-white font-bold text-lg mt-2">{p.body}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-bee-amber text-sm font-bold group-hover:gap-3 transition-all">
                    {p.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topic cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white">Automation playbooks</h2>
          <p className="text-slate-400 mt-3">
            Deep dives on the four workflows teams ask for most — each ready to deploy from your command
            center.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {APP_TOPICS.map((topic, i) => (
            <motion.div
              key={topic.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/app/${topic.slug}`}
                className="group block rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-bee-amber/30 transition-all"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img
                    src={topic.image}
                    alt={topic.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/40 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-white font-black text-xl group-hover:text-bee-amber transition-colors">
                    {topic.label}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">{topic.short}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-bee-amber text-sm font-bold">
                    Explore playbook
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="border-t border-white/5 bg-[#070a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-black text-white mb-2">Apps & websites you can ship</h2>
          <p className="text-slate-500 text-sm mb-8">
            Stock previews — swap in your screenshots anytime. Every style below is buildable from plain
            English.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GALLERY.map((g) => (
              <div key={g.tag} className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                <img src={g.src} alt={g.alt} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 text-white text-xs font-bold backdrop-blur">
                  {g.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community apps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">Working apps — try now</h2>
            <p className="text-slate-500 text-sm mt-1">From the community pool. Install free, run in browser.</p>
          </div>
          <Link to="/hive-apps" className="text-bee-amber font-bold text-sm hover:underline inline-flex items-center gap-1">
            Browse all apps <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <HiveAppCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {featured.map((app) => (
              <HiveAppCard key={app.id} app={app} variant="mobile" runDirect={app.isExample} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-white font-bold">Be the first to share an app</p>
            <Link to="/hive-apps/build" className="inline-block mt-4 px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-bold">
              Build now
            </Link>
          </div>
        )}
      </section>

      {/* Platform strip */}
      <section className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 gap-4">
          <Link
            to="/hive-apps/build"
            className="flex items-center gap-4 rounded-2xl bg-bee-amber/10 border border-bee-amber/30 p-6 hover:bg-bee-amber/15 transition-colors"
          >
            <Globe className="w-8 h-8 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-extrabold">Build on the web</p>
              <p className="text-slate-400 text-sm">Hive Magic — describe, approve, use</p>
            </div>
          </Link>
          <a
            href="/api/download/apk"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-bee-amber/30 transition-colors"
          >
            <Smartphone className="w-8 h-8 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-extrabold">Full experience on Android</p>
              <p className="text-slate-400 text-sm">Download AiBhive APK</p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
