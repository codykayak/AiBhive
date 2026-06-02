import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  Shield,
  Zap,
} from 'lucide-react';
import { SEO } from './SEO';
import { cn } from '../lib/utils';

export interface CategoryStat {
  value: string;
  label: string;
}

export interface CategorySection {
  heading: string;
  body: ReactNode;
  image?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
}

export interface PipelineStep {
  step: string;
  title: string;
  description: string;
}

export interface TechModule {
  name: string;
  description: string;
}

export interface ComparisonRow {
  feature: string;
  legacy: string;
  aibhive: string;
}

export interface CategoryFaq {
  q: string;
  a: string;
}

export interface CategorySeoPageProps {
  seo: { title: string; description: string; keywords?: string };
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  heroImage: string;
  heroAlt: string;
  stats: CategoryStat[];
  intro: ReactNode;
  sections: CategorySection[];
  pipeline: PipelineStep[];
  techStack: TechModule[];
  comparison: ComparisonRow[];
  checklist: string[];
  faqs: CategoryFaq[];
  relatedLinks?: { label: string; href: string }[];
}

export default function CategorySeoPage({
  seo,
  eyebrow,
  title,
  highlight,
  subtitle,
  heroImage,
  heroAlt,
  stats,
  intro,
  sections,
  pipeline,
  techStack,
  comparison,
  checklist,
  faqs,
  relatedLinks,
}: CategorySeoPageProps) {
  return (
    <main className="py-16 md:py-24">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <p className="inline-block px-5 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-xs font-bold uppercase tracking-widest mb-6 border border-bee-amber/20">
            {eyebrow}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {title} <span className="text-gradient">{highlight}</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 img-frame-sharp relative"
        >
          <img src={heroImage} alt={heroAlt} className="w-full object-cover max-h-[520px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-bee-black/80 via-bee-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-md bg-bee-black/80 border border-bee-amber/30 text-bee-amber text-xs font-mono">
              AiBHive Agentic Stack
            </span>
            <span className="px-3 py-1 rounded-md bg-bee-black/80 border border-white/10 text-slate-300 text-xs font-mono">
              HITL · RAG · Event-Driven
            </span>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <article
              key={s.label}
              className="glass-card rounded-xl p-5 text-center border border-white/10 hover:border-bee-amber/30 transition-colors"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-bee-amber mb-1">{s.value}</div>
              <div className="text-slate-400 text-xs uppercase tracking-wide">{s.label}</div>
            </article>
          ))}
        </section>

        <section className="prose prose-invert max-w-none mb-16 text-slate-300 text-lg leading-relaxed space-y-5">
          {intro}
        </section>

        {/* Agentic pipeline module */}
        <section className="mb-16 glass-card rounded-2xl p-8 md:p-12 border border-bee-amber/20 glow-halo">
          <div className="flex items-center gap-3 mb-8">
            <Network className="w-8 h-8 text-bee-amber" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Agentic execution pipeline</h2>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipeline.map((step) => (
              <li key={step.step} className="relative rounded-xl bg-black/30 border border-white/10 p-5">
                <span className="text-bee-amber font-mono text-sm font-bold">{step.step}</span>
                <h3 className="text-white font-bold mt-2 mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {sections.map((sec, i) => (
          <section
            key={sec.heading}
            className={cn(
              'mb-16 glass-card rounded-2xl p-8 md:p-12 border border-white/10',
              sec.image && 'overflow-hidden'
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-10',
                sec.image && sec.imagePosition === 'left' && 'lg:flex-row-reverse',
                sec.image && sec.imagePosition !== 'left' && 'lg:flex-row'
              )}
            >
              <div className={cn(sec.image ? 'lg:w-1/2' : 'w-full')}>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">{sec.heading}</h2>
                <div className="text-slate-300 leading-relaxed space-y-4 text-base md:text-lg">
                  {sec.body}
                </div>
              </div>
              {sec.image && (
                <div className="lg:w-1/2 img-frame-sharp flex-shrink-0">
                  <img
                    src={sec.image}
                    alt={sec.imageAlt ?? sec.heading}
                    className="w-full h-full object-cover min-h-[240px] max-h-[400px]"
                  />
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Tech stack module */}
        <section className="mb-16 rounded-2xl border border-white/10 bg-gradient-to-br from-bee-amber/5 to-transparent p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Cpu className="w-8 h-8 text-bee-amber" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Enterprise technology backbone</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map((t) => (
              <article
                key={t.name}
                className="rounded-xl bg-bee-black/50 border border-white/10 p-5 hover:border-bee-amber/40 transition-colors"
              >
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-bee-amber" />
                  {t.name}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-16 overflow-hidden rounded-2xl border border-white/10">
          <div className="bg-white/5 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-bee-amber" />
              Legacy automation vs. AiBHive agentic workflows
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-bee-black/50 text-slate-400 uppercase text-xs">
                  <th className="px-6 py-4">Capability</th>
                  <th className="px-6 py-4">Traditional stack</th>
                  <th className="px-6 py-4 text-bee-amber">AiBHive</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">{row.feature}</td>
                    <td className="px-6 py-4 text-slate-400">{row.legacy}</td>
                    <td className="px-6 py-4 text-slate-200">{row.aibhive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16 glass-card rounded-2xl p-8 md:p-12 border-bee-amber/30 bg-bee-amber/5">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Shield className="w-7 h-7 text-bee-amber" />
            What AiBHive delivers
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-bee-amber shrink-0 mt-1" />
                <span className="text-slate-200">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((f) => (
              <details key={f.q} className="glass-card rounded-xl p-5 group">
                <summary className="font-semibold text-white cursor-pointer list-none flex justify-between gap-4">
                  {f.q}
                  <span className="text-bee-amber group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-slate-400 mt-4 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {relatedLinks && relatedLinks.length > 0 && (
          <section className="mb-16">
            <h2 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wider">
              Explore other AiBHive categories
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-bee-amber hover:border-bee-amber/40 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="text-center py-12 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">Engineer your first agentic workflow</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Book a strategy session with AiBHive to scope ROI, integrations, and a production rollout plan.
          </p>
          <a
            href="mailto:hello@aibhive.com?subject=Book%20Your%20Strategy%20Session"
            className="inline-flex items-center px-10 py-4 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors neon-glow"
          >
            Book Your Strategy Session <ArrowRight className="ml-2 w-5 h-5" />
          </a>
        </section>
      </div>
    </main>
  );
}
