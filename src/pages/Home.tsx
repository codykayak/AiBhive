import type { ReactNode } from 'react';
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
} from 'lucide-react';
import { SITE_TAGLINE } from '../constants/site';
import backgroundLogo from '../aibhive_background.png';
import leadGenImg from '../grow_content_creators_podcator_veiwership_translations.png';
import orchestrationImg from '../1775559497156.png';
import { SEO } from '../components/SEO';
import { BOOK_CONSULTATION_PATH } from '../constants/navigation';
import DigitalEmployeesInfographics from '../components/DigitalEmployeesInfographics';
import HomeHivePlatform from '../components/HomeHivePlatform';

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
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden min-h-[85vh] flex items-center">
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
              alt=""
              className="w-full h-full object-cover"
              aria-hidden
            />
          </motion.div>
        </div>
        <div className="absolute inset-0 aurora-bg opacity-50 pointer-events-none z-[1]" />

        <motion.div
          style={{ y: heroContentY }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center w-full"
        >
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
        </motion.div>
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

      {/* ——— MAIN CATEGORIES (SEO hubs) ——— */}
      <TechParallaxSection className="py-20 md:py-24 bg-bee-black/95" intensity="medium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="clearfix"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Solution <span className="text-bee-amber">categories</span>
            </h2>

            <figure className="mb-8 md:mb-4 md:float-right md:clear-right md:ml-10 md:max-w-[min(100%,22rem)] lg:max-w-sm">
              <img
                src={orchestrationImg}
                alt="Enterprise workflow orchestration visualization"
                className="w-full rounded-2xl object-cover shadow-lg shadow-bee-amber/10 ring-1 ring-white/10"
              />
            </figure>

            <p className="text-lg text-slate-400 leading-relaxed mb-6">
              Deep-dive guides on each agentic capability we build. Select a category to explore
              architecture, ROI, and implementation paths—we expand these hubs continuously.
            </p>

            <ul className="space-y-1 mb-2 md:mb-0">
              {CATEGORIES.slice(0, 4).map((cat, index) => (
                <motion.li
                  key={cat.href}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={cat.href}
                    className="group flex gap-4 py-4 border-b border-white/5 hover:border-bee-amber/20 transition-colors"
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-bee-amber/10 ring-1 ring-bee-amber/20 group-hover:bg-bee-amber/15 transition-colors">
                      <cat.icon className="h-5 w-5 text-bee-amber" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-base font-bold text-white group-hover:text-bee-amber transition-colors">
                          {cat.title}
                        </h3>
                        <ArrowRight
                          className="h-4 w-4 text-bee-amber/0 group-hover:text-bee-amber transition-all -translate-x-1 group-hover:translate-x-0"
                          aria-hidden
                        />
                      </span>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">{cat.excerpt}</p>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <figure className="my-8 md:my-6 md:float-left md:clear-left md:mr-10 md:max-w-[min(100%,20rem)] lg:max-w-xs">
              <img
                src={leadGenImg}
                alt="Lead generation and pipeline automation"
                className="w-full rounded-2xl object-cover shadow-lg shadow-bee-amber/10 ring-1 ring-white/10"
              />
            </figure>

            <ul className="space-y-1 clear-both md:clear-none">
              {CATEGORIES.slice(4).map((cat, index) => (
                <motion.li
                  key={cat.href}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={cat.href}
                    className="group flex gap-4 py-4 border-b border-white/5 last:border-0 hover:border-bee-amber/20 transition-colors"
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-bee-amber/10 ring-1 ring-bee-amber/20 group-hover:bg-bee-amber/15 transition-colors">
                      <cat.icon className="h-5 w-5 text-bee-amber" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-base font-bold text-white group-hover:text-bee-amber transition-colors">
                          {cat.title}
                        </h3>
                        <ArrowRight
                          className="h-4 w-4 text-bee-amber/0 group-hover:text-bee-amber transition-all -translate-x-1 group-hover:translate-x-0"
                          aria-hidden
                        />
                      </span>
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">{cat.excerpt}</p>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-slate-500 md:clear-both">
              Each hub includes architecture notes, ROI framing, and implementation paths—updated as
              we ship new agent patterns.
            </p>
          </motion.div>
        </div>
      </TechParallaxSection>

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
