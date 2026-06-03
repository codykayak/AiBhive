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
  Shield,
  Zap,
  Search,
  Brain,
  Workflow,
  Scale,
  Building2,
  Smartphone,
} from 'lucide-react';
import backgroundLogo from '../aibhive_background.png';
import leadGenImg from '../grow_content_creators_podcator_veiwership_translations.png';
import customerOpsImg from '../ai_voice_translation_clone_lab.png';
import erpImg from '../transcription_service_legal_medical.png';
import orchestrationImg from '../1775559497156.png';
import terminologyImg from '../ai_translation_grow_podcast_youtube_audince.png';
import { SEO } from '../components/SEO';
import { BOOK_CONSULTATION_PATH } from '../constants/navigation';
import medicalLegalImg from '../transcription_service_legal_medical.png';

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

const AGENT_JOBS = [
  {
    icon: Bot,
    href: '/solutions/ai-lead-generation-automation',
    image: leadGenImg,
    title: 'Autonomous Lead Generation & Nurturing Agent',
    target: 'Best for Real Estate, Wholesaling, and B2B Sales Pipelines',
    body: 'Scrapes public records and directories for specific distress signals or buying intent, qualifies leads, handles initial outreach, and books calls directly on your calendar.',
    value: 'Feeds your sales pipeline 24/7 without adding headcount.',
  },
  {
    icon: Headphones,
    href: '/solutions/ai-customer-operations-automation',
    image: customerOpsImg,
    title: 'Multi-Channel Customer Operations Agent',
    target: 'Best for E-commerce, Logistics, and Local Service Companies',
    body: 'Moves past basic FAQ chatbots. Safely accesses internal databases, order histories, and shipping APIs to resolve complex customer issues, issue refunds, or suggest upgrades across SMS and web chat.',
    value: 'Slashes ticket backlogs and turns customer support into a revenue generator.',
  },
  {
    icon: Database,
    href: '/solutions/intelligent-document-processing-erp',
    image: erpImg,
    title: 'Intelligent Data Processing & ERP Sync',
    target: 'Best for Supply Chain, Construction, and Property Management',
    body: 'Automatically extracts, structures, and validates data from messy, unstructured sources like PDFs, vendor invoices, or scanned receipts, instantly syncing them to internal CRMs and accounting platforms.',
    value: 'Eliminates hours of manual data entry and human error while speeding up billing cycles.',
  },
  {
    icon: GitBranch,
    href: '/solutions/enterprise-workflow-orchestration',
    image: orchestrationImg,
    title: 'Automated Workflow Orchestrators',
    target: 'Best for Digital Agencies and Enterprise Operations',
    body: 'Connects fragmented, legacy business software instantly. Triggers onboarding workflows, provisions user accounts, drafts custom contracts, and alerts internal teams the second an action occurs.',
    value: 'Saves dozens of operational hours per client lifecycle.',
  },
  {
    icon: Scale,
    href: '/solutions/medical-legal-multi-agent-compliance',
    image: medicalLegalImg,
    title: 'Medical & Legal Multi-Agent Hive',
    target: 'Best for Healthcare, Litigation, and Regulated Documentation',
    body: 'Multiple specialized AI agents transcribe, verify medical and legal terminology, cross-check each other for accuracy, and halt for human review when compliance rules require—full audit trail included.',
    value: 'Delivers court- and clinic-grade documentation without single-model guesswork.',
  },
  {
    icon: Building2,
    href: '/solutions/real-estate-ai-automation',
    image: leadGenImg,
    title: 'Real Estate Speed-to-Lead Agent',
    target: 'Best for Investors, Wholesalers, Agents, and Brokerages',
    body: 'Monitors distress signals, syncs with Follow Up Boss and GoHighLevel, and turns missed calls into RAG-trained SMS threads that qualify sellers and book appointments on your calendar.',
    value: 'Closes the five-minute window that wins deals—without hiring more ISA headcount.',
  },
  {
    icon: Smartphone,
    href: '/solutions/phone-systems-ai-integration',
    image: customerOpsImg,
    title: 'Phone & SMS Intelligence Layer',
    target: 'Best for Any Business That Lives on Inbound Calls',
    body: 'Integrates with your existing phone stack. Missed calls trigger an intelligent text within seconds—trained on your scripts and knowledge base—then books qualified leads automatically.',
    value: 'Recovers revenue from callers who would have hung up on voicemail.',
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

const TERMINOLOGY = [
  {
    icon: Workflow,
    term: 'Agentic Workflows',
    definition:
      'Multi-step autonomous task execution, independent planning, tool usage, and real-time self-correction.',
  },
  {
    icon: Zap,
    term: 'Autonomous Execution',
    definition:
      'System operates smoothly without requiring constant human prompt engineering or manual intervention.',
  },
  {
    icon: Shield,
    term: 'Human-in-the-Loop (HITL) Safety',
    definition:
      'High-stakes actions (such as sending invoices or launching email campaigns) halt automatically for human review and approval before execution.',
  },
  {
    icon: Zap,
    term: 'Event-Driven Automation',
    definition:
      'Workflows instantly trigger based on real-world actions, webhook updates, or incoming customer emails.',
  },
  {
    icon: Search,
    term: 'Semantic Search & RAG',
    definition:
      'Uses Retrieval-Augmented Generation to allow custom agents to query and understand private internal business documents and wikis with flawless accuracy.',
  },
  {
    icon: Brain,
    term: 'Cognitive Load Reduction',
    definition:
      'Automates complex mental grunt work so your human staff can focus entirely on creative growth and client retention.',
  },
] as const;

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
        title="AiBHive — Custom Agentic AI Workflows for Enterprise Operations"
        description="AiBHive deploys custom, autonomous agentic workflows that integrate into your tech stack for lead generation, customer operations, and data processing—no supervision required."
        keywords="agentic AI, B2B automation, autonomous workflows, enterprise AI agents, AiBHive, custom AI applications"
        type="WebSite"
      />

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
            AiBHive · Enterprise Agentic AI
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
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10 font-medium"
          >
            <strong className="text-white font-semibold">AiBHive</strong> deploys custom,
            autonomous agentic workflows that integrate seamlessly into your current tech stack to
            handle lead generation, data entry, and customer operations—no supervision required.
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

      {/* ——— SECTION 2: JOBS / CAPABILITIES ——— */}
      <TechParallaxSection className="py-20 md:py-28 bg-bee-dark/40" intensity="subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your next hires are <span className="text-bee-amber">digital employees</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We engineer autonomous agents for specific revenue and operations outcomes—not
              generic software features.
            </p>
          </div>

          <ul className="flex flex-col gap-8">
            {AGENT_JOBS.map((job, index) => (
              <motion.li
                key={job.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="glass-card tech-tile tech-tile-glow-strong rounded-xl overflow-hidden border border-white/10 hover:border-bee-amber/40"
              >
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-2/5 img-frame-sharp m-4 lg:m-6 lg:mr-0 flex-shrink-0">
                    <img
                      src={job.image}
                      alt=""
                      className="w-full h-56 lg:h-full min-h-[220px] object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-8 lg:flex-grow flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-bee-amber/15 border border-bee-amber/25 flex items-center justify-center flex-shrink-0">
                        <job.icon className="w-6 h-6 text-bee-amber" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                          {job.title}
                        </h3>
                        <p className="text-sm font-semibold text-bee-amber/90 mt-2">{job.target}</p>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-5 flex-grow">{job.body}</p>
                    <p className="text-white font-semibold text-base border-l-4 border-bee-amber pl-4 mb-6">
                      {job.value}
                    </p>
                    <Link
                      to={job.href}
                      className="inline-flex items-center text-bee-amber font-semibold hover:text-bee-yellow transition-colors w-fit"
                    >
                      Read full category guide <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </TechParallaxSection>

      <SectionDivider />

      {/* ——— SECTION 3: TERMINOLOGY ——— */}
      <TechParallaxSection className="py-20 md:py-28 bg-bee-black" intensity="medium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Built on an enterprise-grade agentic backbone
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                The vocabulary your CTO and operations leaders expect—implemented in production, not
                slideware.
              </p>
              <dl className="flex flex-col gap-4">
                {TERMINOLOGY.map((item) => (
                  <div
                    key={item.term}
                    className="tech-tile rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
                  >
                    <dt className="text-base font-bold text-white mb-2 flex items-start gap-2">
                      <item.icon className="w-4 h-4 text-bee-amber flex-shrink-0 mt-0.5" aria-hidden />
                      {item.term}
                    </dt>
                    <dd className="text-slate-400 text-sm leading-relaxed">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:w-1/2 w-full img-frame-sharp sticky top-28">
              <img
                src={terminologyImg}
                alt="Global AI operations and semantic intelligence visualization"
                className="w-full object-cover min-h-[400px] max-h-[640px]"
              />
            </div>
          </div>
        </div>
      </TechParallaxSection>

      {/* ——— SECTION 4: CTA BAR ——— */}
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
