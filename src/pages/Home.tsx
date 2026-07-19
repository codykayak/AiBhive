import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import TechParallaxSection, { TechParallaxHeroLayers } from '../components/TechParallaxSection';
import {
  ArrowRight,
  Bot,
  Calendar,
  Headphones,
  Database,
  GitBranch,
  Scale,
  Building2,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { SITE_TAGLINE } from '../constants/site';
import backgroundLogo from '../aibhive_background.png';
import { SEO } from '../components/SEO';
import { BOOK_CONSULTATION_PATH } from '../constants/navigation';
import DigitalEmployeesInfographics from '../components/DigitalEmployeesInfographics';
import HomeHivePlatform from '../components/HomeHivePlatform';
import HeroLogoMarquee from '../components/HeroLogoMarquee';

const CATEGORIES = [
  {
    icon: Bot,
    href: '/solutions/ai-lead-generation-automation',
    title: 'Lead Generation & Nurturing',
    excerpt: 'Autonomous agents for real estate, wholesaling, and B2B pipeline growth.',
  },
  {
    icon: Headphones,
    href: '/solutions/ai-customer-operations-automation',
    title: 'Customer Operations',
    excerpt: 'Omnichannel agents that resolve tickets with live system access.',
  },
  {
    icon: Database,
    href: '/solutions/intelligent-document-processing-erp',
    title: 'Document & ERP Sync',
    excerpt: 'Extract and validate data from PDFs into your accounting stack.',
  },
  {
    icon: GitBranch,
    href: '/solutions/enterprise-workflow-orchestration',
    title: 'Workflow Orchestration',
    excerpt: 'Connect legacy SaaS and automate the full client lifecycle.',
  },
  {
    icon: Scale,
    href: '/solutions/medical-legal-multi-agent-compliance',
    title: 'Medical & Legal AI',
    excerpt: 'Multi-agent cross-checking for accuracy, compliance, and audit trails.',
  },
  {
    icon: Building2,
    href: '/solutions/real-estate-ai-automation',
    title: 'Real Estate',
    excerpt: 'Distress signals, CRM sync, missed-call SMS, and appointment booking for investors and agents.',
  },
  {
    icon: Smartphone,
    href: '/solutions/phone-systems-ai-integration',
    title: 'Phone Systems',
    excerpt: 'Twilio, RingCentral, and OpenPhone—RAG-trained text-back on every missed call.',
  },
  {
    icon: Wrench,
    href: '/solutions/field-service-ai',
    title: 'Field Service AI',
    excerpt: 'AiBhive Pros + Diagnose — HVAC/plumbing diagnosis, dispatch, and living shop knowledge.',
  },
] as const;

function PrimaryCtaLink({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Link
      to={BOOK_CONSULTATION_PATH}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors neon-glow text-base sm:text-lg ${className}`}
    >
      {children}
      <ArrowRight className="w-5 h-5" aria-hidden />
    </Link>
  );
}

function SectionDivider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

export default function Home() {
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 700], [0, 120]);
  const heroContentY = useTransform(scrollY, [0, 700], [0, 40]);
  const solutionsRef = useRef<HTMLElement>(null);
  const { scrollYProgress: solutionsProgress } = useScroll({
    target: solutionsRef,
    offset: ['start end', 'end start'],
  });
  const solutionsBgY = useTransform(solutionsProgress, [0, 1], ['-18%', '18%']);
  const solutionsBgScale = useTransform(solutionsProgress, [0, 0.5, 1], [1.12, 1.05, 1.12]);
  const solutionsGlowY = useTransform(solutionsProgress, [0, 1], ['8%', '-12%']);

  return (
    <main className="relative">
      <SEO
        title="AiBhive — AI App Factory, Community Apps & Enterprise Agentic AI"
        description={SITE_TAGLINE}
        keywords="AiBhive, Bhive Builder, AI app builder, real estate AI, agentic AI, Hive Apps, no-code apps, enterprise automation"
        type="WebSite"
      />

      {/* Crawlable definition — first screen for humans and LLMs */}
      <div className="sr-only">
        <p>{SITE_TAGLINE}</p>
      </div>

      {/* ——— SECTION 1: HERO ——— */}
      <section className="relative flex min-h-[85vh] flex-col overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-0">
        <TechParallaxHeroLayers />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-bee-black/80 via-bee-black/55 to-bee-black z-10" />
          <div className="absolute inset-0 tech-scanlines z-[2] opacity-30" />
          <motion.div
            style={{ y: heroParallaxY }}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.28 }}
            transition={{ duration: 2 }}
            className="w-full h-[115%] -top-[7%] absolute"
          >
            <img
              src={backgroundLogo}
              alt="AiBhive honeycombe brand atmosphere for the AI app factory home page"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
        <div className="absolute inset-0 aurora-bg opacity-50 pointer-events-none z-[1]" />

        <motion.div
          style={{ y: heroContentY }}
          className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 items-center px-4 text-center sm:px-6 lg:px-8"
        >
          <div className="w-full">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-bee-amber font-semibold text-sm uppercase tracking-widest mb-6"
          >
            AiBhive · Enterprise Agentic AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-8 tracking-tight"
          >
            Stop building apps.
            <br />
            <span className="text-gradient">Start hiring AI agents.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-200 leading-relaxed max-w-3xl mx-auto mb-10 font-medium"
          >
            {SITE_TAGLINE}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PrimaryCtaLink>Schedule an Automation Audit</PrimaryCtaLink>
          </motion.div>
          </div>
        </motion.div>

        <HeroLogoMarquee />
      </section>

      <SectionDivider />

      {/* ——— DIGITAL EMPLOYEES (below hero) ——— */}
      <TechParallaxSection className="py-20 md:py-28 bg-bee-dark/40" intensity="subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your next hires are <span className="text-bee-amber">digital employees</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We engineer autonomous agents for specific revenue and operations outcomes—not
              generic software features. The data below shows why speed, recovery, and automation
              matter across the problems AiBHive solves.
            </p>
          </div>

          <DigitalEmployeesInfographics />
        </div>
      </TechParallaxSection>

      <SectionDivider />

      {/* ——— SOLUTION CATEGORIES (parallax hive) ——— */}
      <section
        ref={solutionsRef}
        className="relative overflow-hidden py-24 md:py-32 border-y border-bee-amber/10"
        aria-labelledby="solution-categories-heading"
      >
        <div className="absolute inset-0 z-0" aria-hidden>
          <motion.div
            style={{ y: solutionsBgY, scale: solutionsBgScale }}
            className="absolute inset-x-0 -top-[18%] h-[136%] will-change-transform"
          >
            <img
              src="/solutions-categories-bg.png"
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-bee-black via-bee-black/78 to-bee-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-bee-black/90 via-transparent to-bee-black/85" />
          <div className="absolute inset-0 tech-scanlines opacity-25" />
          <motion.div
            style={{ y: solutionsGlowY }}
            className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-bee-amber/20 blur-[100px]"
          />
          <motion.div
            style={{ y: solutionsGlowY }}
            className="absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-cyan-400/10 blur-[110px]"
          />
        </div>

        <div className="relative z-[1] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mb-14 md:mb-16"
          >
            <p className="text-bee-amber text-xs font-bold uppercase tracking-[0.28em] mb-5">
              Agentic capability map
            </p>
            <h2
              id="solution-categories-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-5"
            >
              Solution <span className="text-gradient">categories</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl">
              Seven production agent stacks — pick a hub for architecture, ROI, and the path from
              first workflow to full orchestration.
            </p>
          </motion.header>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {CATEGORIES.map((cat, index) => {
              const wide = index === 0 || index === CATEGORIES.length - 1;
              return (
                <motion.li
                  key={cat.href}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={wide ? 'md:col-span-2' : undefined}
                >
                  <Link
                    to={cat.href}
                    className="group relative flex items-start gap-5 overflow-hidden rounded-2xl border border-white/10 bg-bee-black/45 px-5 py-5 md:px-7 md:py-6 backdrop-blur-md transition-all duration-500 hover:border-bee-amber/45 hover:bg-bee-black/60 hover:shadow-[0_0_48px_rgba(245,158,11,0.12)]"
                  >
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-bee-amber via-bee-yellow to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-bee-amber/0 blur-3xl transition-all duration-700 group-hover:bg-bee-amber/15" aria-hidden />

                    <span className="relative mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-bee-amber/10 ring-1 ring-bee-amber/25 transition-all duration-500 group-hover:scale-105 group-hover:bg-bee-amber/20 group-hover:ring-bee-amber/50">
                      <cat.icon className="h-5 w-5 text-bee-amber" aria-hidden />
                    </span>

                    <span className="relative min-w-0 flex-1">
                      <span className="mb-2 flex items-center gap-3">
                        <span className="font-mono text-[11px] font-bold tracking-widest text-bee-amber/70">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-bee-amber/30 to-transparent opacity-60" aria-hidden />
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-lg md:text-xl font-bold text-white transition-colors duration-300 group-hover:text-bee-amber">
                          {cat.title}
                        </h3>
                        <ArrowRight
                          className="h-4 w-4 text-bee-amber/40 transition-all duration-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          aria-hidden
                        />
                      </span>
                      <p className="mt-2 text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
                        {cat.excerpt}
                      </p>
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 text-sm text-slate-500"
          >
            Each hub ships with architecture notes, ROI framing, and implementation paths — updated
            as we release new agent patterns.
          </motion.p>
        </div>
      </section>

      <SectionDivider />

      <HomeHivePlatform />

      {/* ——— CTA BAR ——— */}
      <TechParallaxSection
        className="py-16 md:py-20 border-t border-bee-amber/20 bg-gradient-to-r from-bee-amber/10 via-bee-black to-bee-amber/10"
        intensity="strong"
        ambience
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Calendar className="w-10 h-10 text-bee-amber mx-auto mb-6" aria-hidden />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 leading-snug">
              Ready to drastically reduce your team&apos;s cognitive load?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Let&apos;s engineer your first custom agentic workflow.
            </p>
            <PrimaryCtaLink>Book Your Strategy Session</PrimaryCtaLink>
          </motion.div>
        </div>
      </TechParallaxSection>
    </main>
  );
}
