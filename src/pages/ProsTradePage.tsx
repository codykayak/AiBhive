import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, MessageSquare, Wrench } from 'lucide-react';
import { SEO } from '../components/SEO';
import ProsGetAppCta from '../components/pros/ProsGetAppCta';
import ProsPageHeader from '../components/pros/ProsPageHeader';
import { getProsTradeBySlug, PROS_TRADE_LIST } from '../components/pros/prosTradePages';
import NotFound from './NotFound';

export default function ProsTradePage() {
  const { tradeSlug } = useParams<{ tradeSlug: string }>();
  const trade = getProsTradeBySlug(tradeSlug);

  if (!trade) return <NotFound />;

  const Icon = trade.icon;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <SEO title={trade.seoTitle} description={trade.seoDescription} />

      <ProsPageHeader />

      {/* Trade hero */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ background: `linear-gradient(135deg, ${trade.accentColor}, #1E3A8A)` }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <Link
            to="/pros"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All trades
          </Link>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider mb-5"
              style={{ borderColor: `${trade.accentColor}44`, color: trade.accentColor, backgroundColor: `${trade.accentColor}14` }}
            >
              <Icon className="w-3.5 h-3.5" />
              {trade.heroEyebrow}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] max-w-3xl">
              {trade.name}{' '}
              <span style={{ color: trade.accentColor }}>field intelligence</span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-slate-600">{trade.tagline}</p>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-2xl">{trade.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pros/app"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-6 py-3.5"
              >
                <Wrench className="w-5 h-5" />
                Set up {trade.shortName} HQ
              </Link>
              <a
                href="/download.html"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 font-bold px-6 py-3.5 text-slate-700"
              >
                Get Diagnose app
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight">What techs diagnose in the field</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">
            The {trade.shortName} pack in AiBhive Diagnose covers the calls your shop runs every day — with voice-first
            guidance and OEM manual search when you need model-specific detail.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {trade.categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="font-bold text-lg">{cat.label}</h3>
                <ul className="mt-3 space-y-1.5">
                  {cat.examples.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: trade.accentColor }} />
                      {ex}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick prompts + equipment */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <MessageSquare className="w-4 h-4" />
              Tap-to-ask prompts
            </div>
            <h2 className="text-2xl font-black tracking-tight">Start talking in seconds</h2>
            <ul className="mt-6 space-y-3">
              {trade.quickPrompts.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  “{prompt}”
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <BookOpen className="w-4 h-4" />
              Common equipment
            </div>
            <h2 className="text-2xl font-black tracking-tight">Built for real trucks</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {trade.commonEquipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
            <h3 className="font-bold mt-10 mb-4">Pros HQ for {trade.shortName} shops</h3>
            <ul className="space-y-3">
              {trade.prosFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Other trades */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Other trade packs</h2>
          <div className="flex flex-wrap gap-2">
            {PROS_TRADE_LIST.filter((t) => t.id !== trade.id).map((t) => (
              <Link
                key={t.id}
                to={`/pros/${t.slug}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProsGetAppCta tradeName={trade.name} accentColor={trade.accentColor} />

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <Link to="/pros" className="hover:text-slate-800">
          ← Back to AiBhive Pros
        </Link>
      </footer>
    </div>
  );
}
