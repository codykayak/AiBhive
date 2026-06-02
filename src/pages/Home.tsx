import type { ReactNode } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { SEO } from '../components/SEO';

const AUDIT_MAILTO =
  'mailto:hello@aibhive.com?subject=Schedule%20an%20Automation%20Audit';
const STRATEGY_MAILTO =
  'mailto:hello@aibhive.com?subject=Book%20Your%20Strategy%20Session';

const AGENT_JOBS = [
  {
    icon: Bot,
    title: 'Autonomous Lead Generation & Nurturing Agent',
    target: 'Best for Real Estate, Wholesaling, and B2B Sales Pipelines',
    body: 'Scrapes public records and directories for specific distress signals or buying intent, qualifies leads, handles initial outreach, and books calls directly on your calendar.',
    value: 'Feeds your sales pipeline 24/7 without adding headcount.',
  },
  {
    icon: Headphones,
    title: 'Multi-Channel Customer Operations Agent',
    target: 'Best for E-commerce, Logistics, and Local Service Companies',
    body: 'Moves past basic FAQ chatbots. Safely accesses internal databases, order histories, and shipping APIs to resolve complex customer issues, issue refunds, or suggest upgrades across SMS and web chat.',
    value: 'Slashes ticket backlogs and turns customer support into a revenue generator.',
  },
  {
    icon: Database,
    title: 'Intelligent Data Processing & ERP Sync',
    target: 'Best for Supply Chain, Construction, and Property Management',
    body: 'Automatically extracts, structures, and validates data from messy, unstructured sources like PDFs, vendor invoices, or scanned receipts, instantly syncing them to internal CRMs and accounting platforms.',
    value: 'Eliminates hours of manual data entry and human error while speeding up billing cycles.',
  },
  {
    icon: GitBranch,
    title: 'Automated Workflow Orchestrators',
    target: 'Best for Digital Agencies and Enterprise Operations',
    body: 'Connects fragmented, legacy business software instantly. Triggers onboarding workflows, provisions user accounts, drafts custom contracts, and alerts internal teams the second an action occurs.',
    value: 'Saves dozens of operational hours per client lifecycle.',
  },
] as const;

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

function PrimaryCta({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-bee-amber text-bee-black font-bold rounded-lg hover:bg-bee-yellow transition-colors neon-glow text-base sm:text-lg ${className}`}
    >
      {children}
      <ArrowRight className="w-5 h-5" aria-hidden />
    </a>
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}

export default function Home() {
  return (
    <main className="relative">
      <SEO
        title="AiBHive — Custom Agentic AI Workflows for Enterprise Operations"
        description="AiBHive deploys custom, autonomous agentic workflows that integrate into your tech stack for lead generation, customer operations, and data processing—no supervision required."
        keywords="agentic AI, B2B automation, autonomous workflows, enterprise AI agents, AiBHive, custom AI applications"
        type="WebSite"
      />

      {/* ——— SECTION 1: HERO ——— */}
      <section className="relative py-24 md:py-32 lg:py-40 aurora-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bee-black/30 via-transparent to-bee-black pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
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
            <PrimaryCta href={AUDIT_MAILTO}>Schedule an Automation Audit</PrimaryCta>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ——— SECTION 2: JOBS / CAPABILITIES ——— */}
      <section className="py-20 md:py-28 bg-bee-black">
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

          <ul className="flex flex-col gap-6">
            {AGENT_JOBS.map((job, index) => (
              <motion.li
                key={job.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="glass-card rounded-xl p-6 sm:p-8 border border-white/10 hover:border-bee-amber/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-bee-amber/15 border border-bee-amber/25 flex items-center justify-center">
                    <job.icon className="w-6 h-6 text-bee-amber" aria-hidden />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
                      {job.title}
                    </h3>
                    <p className="text-sm font-semibold text-bee-amber/90 mb-4">{job.target}</p>
                    <p className="text-slate-300 leading-relaxed mb-5">{job.body}</p>
                    <p className="text-white font-semibold text-base border-l-4 border-bee-amber pl-4">
                      {job.value}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <SectionDivider />

      {/* ——— SECTION 3: TERMINOLOGY ——— */}
      <section className="py-20 md:py-28 bg-bee-dark/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built on an enterprise-grade agentic backbone
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              The vocabulary your CTO and operations leaders expect—implemented in production, not
              slideware.
            </p>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TERMINOLOGY.map((item, index) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
              >
                <dt className="text-base font-bold text-white mb-2 flex items-start gap-2">
                  <item.icon className="w-4 h-4 text-bee-amber flex-shrink-0 mt-0.5" aria-hidden />
                  {item.term}
                </dt>
                <dd className="text-slate-400 text-sm leading-relaxed">{item.definition}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ——— SECTION 4: CTA BAR ——— */}
      <section className="py-16 md:py-20 border-t border-bee-amber/20 bg-gradient-to-r from-bee-amber/10 via-bee-black to-bee-amber/10">
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
            <PrimaryCta href={STRATEGY_MAILTO}>Book Your Strategy Session</PrimaryCta>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
