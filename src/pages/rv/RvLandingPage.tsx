import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Code2,
  Gauge,
  Layers,
  LineChart,
  Plug,
  Sparkles,
  Truck,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { RV_DEALER_SYSTEMS, RV_ENTERPRISE_BULLETS } from '../../content/rvEnterprise';
import {
  RV_EMBED_SCRIPT_SNIPPET,
  RV_HERO_STATS,
  RV_HOW_IT_WORKS,
  RV_PERSONAS,
} from '../../content/rvSiteContent';
import { RvFaq } from '../../components/rv/RvFaq';
import { RvInventoryGrid } from '../../components/rv/RvInventoryGrid';
import { RvMatcher } from '../../components/rv/RvMatcher';
import { SITE_URL } from '../../constants/site';

export default function RvLandingPage() {
  return (
    <main className="relative pb-24">
      <SEO
        title="RV Dealer AI — Enterprise DMS + Shopper Match Widget | AiBhive"
        description="AiBhive RV: IDS, Lightspeed, and inventory feeds for wholesalers; embeddable AI matches shoppers by budget, lifestyle, and towing. Camping World demo."
        keywords="RV dealership AI, RV DMS, IDS Astra, Lightspeed RV, Camping World demo, tow capacity, RV embed widget"
        jsonLd={{
          '@type': 'WebPage',
          name: 'AiBhive RV Solutions',
          url: `${SITE_URL}/rv`,
          description: 'Enterprise RV retail AI and consumer match assistant.',
        }}
      />

      <section className="relative min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-bee-black to-bee-black" aria-hidden />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-4"
          >
            AiBhive · RV retail AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.08] max-w-4xl mb-6"
          >
            Sell the right rig.
            <br />
            <span className="text-gradient">Before they bounce.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 max-w-2xl mb-8"
          >
            <strong className="text-white">Enterprise</strong> connects your DMS and feeds.{' '}
            <strong className="text-white">Shopper AI</strong> embeds on dealer sites — budget, lifestyle, tow
            capacity, and ranked matches from <strong className="text-white">your</strong> inventory. Live demo
            uses Camping World–style sample stock.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/rv/demo"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors"
            >
              Try shopper demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/rv/enterprise"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5"
            >
              Enterprise rollout
            </Link>
            <Link
              to="/rv/inventory"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-slate-300 font-semibold hover:text-white"
            >
              Browse demo lot
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-3 gap-8">
          {RV_HERO_STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-bee-amber">{s.value}</p>
              <p className="text-white font-semibold text-sm mt-1">{s.label}</p>
              <p className="text-slate-500 text-xs mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-10">
        <article className="rounded-2xl border border-white/10 bg-black/30 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">1 · Enterprise & wholesale</h2>
          </div>
          <p className="text-slate-400 mb-6 leading-relaxed">
            IDS Astra, Lightspeed, CDK, DealerSocket, and flat-file feeds — normalized into one match engine for
            every rooftop and wholesale portal.
          </p>
          <ul className="space-y-3 text-sm text-slate-300 mb-6">
            {RV_ENTERPRISE_BULLETS.map((line) => (
              <li key={line} className="flex gap-2">
                <Layers className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
                {line}
              </li>
            ))}
          </ul>
          <Link to="/rv/enterprise" className="text-bee-amber font-semibold text-sm hover:underline">
            Packages & pilot request →
          </Link>
        </article>

        <article className="rounded-2xl border border-bee-amber/25 bg-bee-amber/5 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-bee-amber" />
            <h2 className="text-2xl font-bold text-white">2 · Embeddable shopper AI</h2>
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Natural language + structured filters. Monthly or total budget. Tow ratings that protect your
            reputation and reduce mismatched deals.
          </p>
          <ul className="space-y-3 text-sm text-slate-300 mb-6">
            <li className="flex gap-2">
              <Truck className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
              Hitch weight & minimum tow capacity per unit
            </li>
            <li className="flex gap-2">
              <Plug className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
              iframe + optional script embed
            </li>
            <li className="flex gap-2">
              <Code2 className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
              CRM-ready transcripts and fit scores
            </li>
          </ul>
          <Link to="/rv/embed" className="text-bee-amber font-semibold text-sm hover:underline">
            Preview embed →
          </Link>
        </article>
      </section>

      <section className="border-y border-white/10 bg-black/40 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {RV_HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center md:text-left">
                <span className="text-4xl font-black text-white/10">{step.step}</span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Try the matcher now</h2>
            <p className="text-slate-400 text-sm mt-2">Camping World–style demo catalog · not live inventory</p>
          </div>
          <Link to="/rv/demo" className="text-bee-amber font-semibold text-sm hover:underline">
            Full-screen demo →
          </Link>
        </div>
        <RvMatcher />
      </section>

      <section className="border-t border-white/10 py-16 bg-black/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-2">Demo lot snapshot</h2>
          <p className="text-slate-400 text-sm mb-8">
            Representative travel trailers, fifth wheels, and motorhomes with tow math built in.
          </p>
          <RvInventoryGrid compact />
          <Link
            to="/rv/inventory"
            className="inline-block mt-6 text-sm font-semibold text-bee-amber hover:underline"
          >
            View full catalog & filters →
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Gauge className="w-6 h-6 text-emerald-400" />
          Built for your segment
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {RV_PERSONAS.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3">{p.title}</h3>
              <ul className="text-xs text-slate-400 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="integrations" className="border-y border-white/10 bg-black/40 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-3">Dealer systems we integrate with</h2>
          <p className="text-slate-400 max-w-3xl mb-10">
            RV-specific DMS and feeds (research summary — not partnership claims). We meet you where your data
            already lives.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RV_DEALER_SYSTEMS.slice(0, 6).map((sys) => (
              <div
                key={sys.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col"
              >
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 mb-1">
                  {sys.category}
                </span>
                <h3 className="font-bold text-white mb-2">{sys.name}</h3>
                <p className="text-xs text-slate-400 flex-grow">{sys.summary}</p>
              </div>
            ))}
          </div>
          <Link
            to="/rv/enterprise"
            className="inline-flex items-center gap-2 mt-8 text-bee-amber font-semibold hover:underline"
          >
            See full integration map
            <LineChart className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Install on any dealer site</h2>
        <pre className="text-xs text-slate-300 bg-black/50 rounded-xl p-4 overflow-x-auto border border-white/10 mb-4">
          {`<div id="aibhive-rv"></div>\n<script>${RV_EMBED_SCRIPT_SNIPPET}</script>`}
        </pre>
        <p className="text-xs text-slate-500">
          Replace <code className="text-slate-400">YOUR_ID</code> with your tenant when onboarded. iframe-only
          option at <Link to="/rv/embed" className="text-bee-amber">/rv/embed</Link>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">FAQ</h2>
        <RvFaq />
      </section>

      <section className="border-t border-bee-amber/20 bg-bee-amber/5 py-14">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to pilot on your lot?</h2>
          <p className="text-slate-400 mb-8">
            Start with the public demo, then connect your feed. Most groups begin with one rooftop and expand.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/rv/enterprise"
              className="px-8 py-3.5 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow"
            >
              Request enterprise pilot
            </Link>
            <Link
              to="/book-consultation"
              className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/5"
            >
              Book a call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
