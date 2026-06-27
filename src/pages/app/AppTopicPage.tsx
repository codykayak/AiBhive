import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { TOPIC_PAGES, type AppTopicSlug } from './appContent';

const SLUGS = new Set(Object.keys(TOPIC_PAGES));

export default function AppTopicPage() {
  const { pathname } = useLocation();
  const topicSlug = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean)[0] || '';
  if (!topicSlug || !SLUGS.has(topicSlug)) {
    return <Navigate to="/app" replace />;
  }
  const page = TOPIC_PAGES[topicSlug as AppTopicSlug];

  return (
    <>
      <SEO title={page.seo.title} description={page.seo.description} keywords={page.seo.keywords} />

      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-bee-amber text-sm font-bold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App Command Center
        </Link>

        <header className="grid lg:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-4">{page.eyebrow}</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              {page.title}{' '}
              <span className="text-bee-amber">{page.highlight}</span>
            </h1>
            <p className="text-slate-400 text-lg mt-5 leading-relaxed">{page.subtitle}</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to={page.primaryCta.href}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-bee-amber text-bee-black font-extrabold hover:bg-bee-yellow transition-colors"
              >
                {page.primaryCta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={page.secondaryCta.href}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 text-white font-bold hover:border-bee-amber/40 transition-colors"
              >
                {page.secondaryCta.label}
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3]">
            <img src={page.heroImage} alt={page.heroAlt} className="w-full h-full object-cover" />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {page.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-bee-amber">{s.value}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-invert max-w-none mb-16 space-y-4">
          {page.intro.map((para) => (
            <p key={para.slice(0, 40)} className="text-slate-300 text-lg leading-relaxed">
              {para.split('**').map((chunk, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="text-white font-bold">
                    {chunk}
                  </strong>
                ) : (
                  chunk
                )
              )}
            </p>
          ))}
        </div>

        <div className="space-y-12 mb-16">
          {page.sections.map((sec, i) => (
            <motion.section
              key={sec.heading}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10"
            >
              <h2 className="text-2xl font-black text-white">{sec.heading}</h2>
              <p className="text-slate-400 mt-3 leading-relaxed">{sec.body}</p>
              {sec.bullets ? (
                <ul className="mt-5 space-y-2">
                  {sec.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.section>
          ))}
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-black text-white mb-6">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {page.pipeline.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border border-white/10 bg-[#070a0f] p-5"
              >
                <p className="text-bee-amber font-black text-2xl">{step.step}</p>
                <p className="text-white font-bold mt-2">{step.title}</p>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="rounded-3xl border border-bee-amber/20 bg-bee-amber/5 p-8">
            <h2 className="text-xl font-black text-white mb-4">Launch checklist</h2>
            <ul className="space-y-3">
              {page.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-bee-amber shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white">FAQ</h2>
            {page.faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/10 p-5">
                <p className="text-white font-bold text-sm">{faq.q}</p>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-3xl bg-gradient-to-r from-bee-amber/20 to-transparent border border-bee-amber/25 p-8 md:p-10 text-center">
          <p className="text-white font-black text-2xl">Ready to build it?</p>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto">
            No coding — describe your command center and AiBhive ships the app. BYOK or use our APIs.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              to="/app/build"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-bee-amber text-bee-black font-extrabold"
            >
              Build with Hive Magic
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white font-bold"
            >
              Explore all features
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
