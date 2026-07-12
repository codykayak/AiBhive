import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  MapPinned,
  Radio,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import {
  LANDING_CHART_DEMO,
  ProsKnowledgeGrowthChart,
} from '../components/pros/ProsKnowledgeCharts';

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

export default function ProsLanding() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <SEO
        title="AiBhive Pros — Living field knowledge for trade companies"
        description="Dispatch jobs, grow a living knowledge base from every tech in the field, and run your shop from one HQ. Built for pool, HVAC, electrical, and property teams."
      />

      {/* Top bar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/pros" className="font-black text-lg tracking-tight">
            AiB<span className="text-[#F5A623]">hive</span>{' '}
            <span className="text-slate-500 font-bold text-sm">Pros</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 hidden sm:inline">
              AiBhive home
            </Link>
            <Link
              to="/pros/app"
              className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold text-sm px-4 py-2.5"
            >
              Open admin <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-50" />
        <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-[#F5A623]/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E3A8A]/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1E3A8A]/15 bg-[#1E3A8A]/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Living knowledge base
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black leading-[1.05] tracking-tight text-slate-900">
                Field intelligence that{' '}
                <span className="text-[#F5A623]">grows</span> with every job.
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                AiBhive Pros is HQ for trade companies — dispatch, team roster, periodic GPS, and a knowledge base
                pulled from the techs actually turning wrenches. Diagnose in the truck; wisdom compounds in the cloud.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/pros/app"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-6 py-3.5"
                >
                  <Wrench className="w-5 h-5" />
                  Launch company HQ
                </Link>
                <a
                  href="#how-it-grows"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:border-slate-400 font-bold px-6 py-3.5 text-slate-700"
                >
                  <BookOpen className="w-5 h-5" />
                  See how it grows
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Field app: <strong>AiBhive Diagnose</strong> · Admin: aibhive.com/pros/app
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/10 aspect-[16/10] bg-slate-200">
                <img
                  src="/pros/hero-field-team.png"
                  alt="Field technicians collaborating with tablets and equipment on a job site"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="text-white">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-300">Video coming soon</div>
                    <div className="text-sm font-semibold mt-0.5">Watch Pros + Diagnose in the field</div>
                  </div>
                  <div className="rounded-lg bg-white/95 backdrop-blur px-3 py-2 text-right shrink-0">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Knowledge nodes</div>
                    <div className="text-lg font-black text-[#1E3A8A]">+128</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section id="how-it-grows" className="py-16 bg-white border-y border-slate-200">
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
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
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Radio className="w-4 h-4" />
            The loop
          </div>
          <h2 className="text-3xl font-black tracking-tight">Diagnose → document → compound</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {FLOW.map((f) => (
              <div key={f.step} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="text-3xl font-black text-amber-400/80">{f.step}</div>
                <h3 className="font-bold mt-2 text-lg">{f.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-800">
          ← Back to AiBhive
        </Link>
      </footer>
    </div>
  );
}
