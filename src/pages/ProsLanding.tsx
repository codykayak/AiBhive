import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  Mail,
  MapPinned,
  MessageSquare,
  Moon,
  Radio,
  Sparkles,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import ProsGetAppCta from '../components/pros/ProsGetAppCta';
import ProsPricingSection from '../components/pros/ProsPricingSection';
import ProsHeroVideo from '../components/pros/ProsHeroVideo';
import ProsPageHeader from '../components/pros/ProsPageHeader';
import ProsFieldAiFeatures from '../components/pros/ProsFieldAiFeatures';
import ProsPoweredByGrokVideo from '../components/pros/ProsPoweredByGrokVideo';
import {
  LANDING_CHART_DEMO,
  ProsKnowledgeGrowthChart,
} from '../components/pros/ProsKnowledgeCharts';
import { PROS_TRADE_LIST } from '../components/pros/prosTradePages';
import ProsVoiceCallPanel from '../components/pros/ProsVoiceCallPanel';
import ProsVoiceFlowInfographic from '../components/pros/ProsVoiceFlowInfographic';
import { openProsVoicePanel } from '../lib/prosVoiceEvents';

function TryAiVoiceButton({
  className = '',
  startCall = true,
}: {
  className?: string;
  startCall?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => openProsVoicePanel({ startCall })}
      className={className}
    >
      <Radio className="w-5 h-5" />
      Try Ai Voice
    </button>
  );
}

const PILLARS = [
  {
    icon: Brain,
    title: 'Living knowledge base',
    body: 'Every diagnose, field note, and “that worked” fix grows a searchable corpus your whole shop inherits.',
  },
  {
    icon: Users,
    title: 'Crowdsourced by techs',
    body: 'Pool, HVAC, electrical, and property packs learn from real trucks — anonymized tips can even help the network.',
  },
  {
    icon: Bell,
    title: 'Dispatch that talks back',
    body: 'Push job updates to Diagnose. Techs confirm completion and describe the fix — it feeds the knowledge loop.',
  },
  {
    icon: MapPinned,
    title: 'Where is everybody?',
    body: 'Periodic GPS check-ins (not live stalking). Managers see the roster on a map when tracking is enabled.',
  },
];

const FLOW = [
  { step: '1', title: 'Tech diagnoses in the field', detail: 'Voice, photo, or chat — offline pack library + AI when signed in.' },
  { step: '2', title: 'Fix gets captured', detail: 'Notes, photos, and feedback sync to Pros HQ automatically.' },
  { step: '3', title: 'Knowledge compounds', detail: 'Tips, manuals, and job outcomes make the next call faster.' },
];

const FULL_SERVICE = [
  {
    icon: MessageSquare,
    title: 'Auto-response texts & emails',
    body: 'Missed-call texts, appointment confirmations, and “we got your message” replies — so customers hear back in seconds, not tomorrow.',
  },
  {
    icon: Mail,
    title: 'Inbox that keeps moving',
    body: 'Route service requests from email into Pros HQ. AI drafts replies you can approve, or sends templated updates when a tech is en route.',
  },
  {
    icon: Radio,
    title: 'Never miss a call',
    body: 'AiBhive Voice answers your shop line when the team is on a roof or under a sink — captures the issue, customer details, and urgency before you call back.',
  },
  {
    icon: Truck,
    title: 'Dispatch technicians',
    body: 'Turn intake into assigned jobs, push updates to Diagnose, and see who is closest when GPS check-ins are enabled.',
  },
  {
    icon: Moon,
    title: 'After-hours triage',
    body: 'Nights and weekends: AI separates true emergencies from “can wait till Monday,” documents symptoms, and queues the right morning dispatch.',
  },
];

export default function ProsLanding() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <SEO
        title="AiBhive Pros — Living field knowledge for trade companies"
        description="Dispatch jobs, grow a living knowledge base from every tech in the field, and run your shop from one HQ. Built for pool, HVAC, electrical, and property teams."
      />

      <ProsPageHeader variant="dark" transparent />

      {/* Full-screen video hero */}
      <ProsHeroVideo>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Living knowledge base
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white">
              Field intelligence that{' '}
              <span className="text-[#F5A623]">grows</span> with every job.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-200 leading-relaxed max-w-2xl">
              Full-service HQ for small trade shops — auto-response texts and emails, AI call answering, dispatch, and
              field Diagnose in one place. Wisdom compounds in the cloud while AiBhive Voice handles the front office.
            </p>
            <motion.div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/pros/app"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-6 py-3.5"
              >
                <Wrench className="w-5 h-5" />
                Launch company HQ
              </Link>
              <a
                href="#full-service"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 backdrop-blur font-bold px-6 py-3.5 text-white"
              >
                <Sparkles className="w-5 h-5" />
                Full-service front office
              </a>
              <a
                href="#how-it-grows"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 backdrop-blur font-bold px-6 py-3.5 text-white"
              >
                <BookOpen className="w-5 h-5" />
                See how it grows
              </a>
              <TryAiVoiceButton className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur font-bold px-6 py-3.5 text-amber-100" />
            </motion.div>
            <p className="mt-5 text-sm text-slate-400">
              Field app: <strong className="text-slate-200">AiBhive Diagnose</strong> · Admin: aibhive.com/pros/app ·{' '}
              <strong className="text-slate-200">AiBhive Voice</strong> on the phone or via Talk below
            </p>
          </motion.div>
        </div>
      </ProsHeroVideo>

      {/* Trade packs + powered-by video */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight text-center">Built for your trade</h2>
          <p className="text-center text-slate-600 mt-3 max-w-2xl mx-auto">
            Each pack ships with field prompts, equipment playbooks, and Pros HQ workflows tuned to how your shop runs.
          </p>
          <div className="grid lg:grid-cols-2 gap-8 mt-12 items-stretch">
            <div className="flex flex-col gap-6">
              <ProsPoweredByGrokVideo className="min-h-[280px]" />
              <ProsFieldAiFeatures />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
            {PROS_TRADE_LIST.map((trade, i) => {
              const Icon = trade.icon;
              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={`/pros/${trade.slug}`}
                    className="group block h-full rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${trade.accentColor}22` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: trade.accentColor }} />
                    </div>
                    <h3 className="font-bold group-hover:text-[#1E3A8A]">{trade.name}</h3>
                    <p className="text-xs font-semibold mt-1" style={{ color: trade.accentColor }}>
                      {trade.tagline}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">{trade.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1E3A8A] mt-4 group-hover:gap-2 transition-all">
                      Explore pack <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section id="how-it-grows" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">A knowledge base that breathes</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Unlike static PDF binders, Pros aggregates field tips, diagnose feedback, manual excerpts, and job
                outcomes into charts your managers can actually use. Example growth curve below — your company dashboard
                shows real numbers once techs start contributing.
              </p>
              <ul className="mt-6 space-y-3">
                {['Field tips from every truck', 'Diagnose “that worked” feedback', 'OEM manual RAG ingest', 'Job completion fixes'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <Zap className="w-4 h-4 text-[#F5A623] shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Example shop growth</div>
              <ProsKnowledgeGrowthChart data={LANDING_CHART_DEMO} variant="light" />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-center tracking-tight">Built for shops, not spreadsheets</h2>
          <p className="text-center text-slate-600 mt-3 max-w-2xl mx-auto">
            Dispatch, notify, locate, and learn — without bolting together five different tools.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Radio className="w-4 h-4" />
            The loop
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Diagnose → document → compound</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {FLOW.map((f) => (
              <div key={f.step} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-black text-amber-500/90">{f.step}</div>
                <h3 className="font-bold mt-2 text-lg text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-service front office */}
      <section id="full-service" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
              Full-service for small shops
            </div>
            <h2 className="text-3xl font-black tracking-tight">Front office automation — not another enterprise stack</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Pool guys, HVAC crews, and one-truck electricians need the same things big shops buy CRMs for: customers
              get answered, jobs get dispatched, and nothing falls through after 5 PM. Pros bundles it for teams your size.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FULL_SERVICE.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F5A623]/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#c47d00]" />
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AiBhive Voice */}
      <section id="voice" className="py-16 bg-gradient-to-b from-amber-50 to-white border-y border-amber-100 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
                <Radio className="w-3.5 h-3.5" />
                Never miss a call
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                AiBhive Voice — your after-hours & overflow line
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Use <strong className="text-slate-900">Try Ai Voice</strong> below or{' '}
                <strong className="text-slate-900">Talk to Pros AI</strong> — the same agent handles intake, triage, and
                trade playbooks when your team is busy or off the clock. It captures who called, what broke, and how
                urgent it is so dispatch can act first thing in the morning — or now, if it cannot wait.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TryAiVoiceButton className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-5 py-3 shadow-sm" />
                <Link
                  to="/pros/app?tab=voice"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:border-amber-400 font-bold px-5 py-3 text-slate-800 shadow-sm"
                >
                  Voice settings
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>
                  <strong className="text-slate-900">Browser:</strong> live mic session on this page — same agent as your
                  shop line.
                </li>
                <li>
                  <strong className="text-slate-900">Dispatch-ready:</strong> urgency, trade, and symptom captured for your
                  morning board or emergency callback list.
                </li>
                <li>
                  <strong className="text-slate-900">Trades:</strong> HVAC, plumbing, electrical, pool, property, and fiber
                  playbooks built in.
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <ProsVoiceFlowInfographic variant="light" />
            </motion.div>
          </div>
        </div>
      </section>

      <ProsPricingSection />

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight">Ready to wire up your shop?</h2>
          <p className="mt-4 text-slate-600">
            Create your company HQ, invite techs with a code, and point them to AiBhive Diagnose. Your knowledge base
            starts growing on the first job.
          </p>
          <Link
            to="/pros/app"
            className="inline-flex items-center gap-2 mt-8 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-8 py-4 text-lg"
          >
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <ProsGetAppCta />

      <ProsVoiceCallPanel />
    </div>
  );
}
