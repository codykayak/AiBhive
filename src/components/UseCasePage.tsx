import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEO } from './SEO';

export interface UseCasePageSection {
  heading: string;
  body: ReactNode;
}

export interface UseCasePageStat {
  value: string;
  label: string;
}

export interface UseCasePageFAQ {
  q: string;
  a: string;
}

interface UseCasePageProps {
  seo: {
    title: string;
    description: string;
    keywords?: string;
  };
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  heroImage: string;
  heroAlt: string;
  stats?: UseCasePageStat[];
  intro: ReactNode;
  sections: UseCasePageSection[];
  checklistTitle?: string;
  checklist?: string[];
  faqs?: UseCasePageFAQ[];
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButton?: string;
}

export default function UseCasePage({
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
  checklistTitle,
  checklist,
  faqs,
  ctaTitle = 'Ready to grow with the Hive?',
  ctaSubtitle = 'Upload your first file and see what multi-agent AI feels like.',
  ctaButton = 'Try AiBhive Free',
}: UseCasePageProps) {
  return (
    <main className="py-24">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6"
          >
            {eyebrow}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.05]"
          >
            {title} <span className="text-gradient">{highlight}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </header>

        {/* Hero image */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 img-frame-sharp relative group"
        >
          <img
            src={heroImage}
            alt={heroAlt}
            className="w-full object-cover max-h-[560px] transition-transform duration-[1500ms] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bee-black/70 via-transparent to-transparent" />
        </motion.section>

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((s, i) => (
              <motion.article
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card p-6 rounded-lg text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-bee-amber mb-2">{s.value}</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">{s.label}</div>
              </motion.article>
            ))}
          </section>
        )}

        {/* Intro */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="prose prose-invert max-w-3xl mx-auto mb-20 text-lg text-slate-300 leading-relaxed"
        >
          {intro}
        </motion.section>

        {/* Body sections */}
        <div className="space-y-16 mb-20">
          {sections.map((sec, i) => (
            <motion.section
              key={sec.heading}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="glass-card rounded-lg p-10 md:p-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{sec.heading}</h2>
              <div className="text-slate-300 leading-relaxed text-lg space-y-5">{sec.body}</div>
            </motion.section>
          ))}
        </div>

        {/* Checklist */}
        {checklist && checklist.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="glass-card rounded-lg p-10 md:p-14 mb-20 border-bee-amber/30 bg-bee-amber/5 glow-halo"
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              {checklistTitle || 'What you get with the Hive'}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {checklist.map((item) => (
                <li key={item} className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-bee-amber mr-4 shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <section className="mb-24">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((f, i) => (
                <motion.details
                  key={f.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="glass-card rounded-lg p-6 group"
                >
                  <summary className="font-bold text-white text-lg cursor-pointer flex items-center justify-between">
                    {f.q}
                    <span className="text-bee-amber ml-4 transition-transform group-open:rotate-45 text-2xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-slate-400 mt-4 leading-relaxed">{f.a}</p>
                </motion.details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 glow-halo"
        >
          <h2 className="text-4xl font-bold text-white mb-6">{ctaTitle}</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">{ctaSubtitle}</p>
          <Link
            to="/get-started"
            className="inline-flex items-center px-12 py-6 bg-bee-amber text-bee-black font-extrabold rounded-full hover:bg-bee-yellow transition-all neon-glow text-xl"
          >
            {ctaButton} <ArrowRight className="ml-3 w-7 h-7" />
          </Link>
        </motion.section>
      </div>
    </main>
  );
}
