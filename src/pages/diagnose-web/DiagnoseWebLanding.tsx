import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Layers,
  MessageSquare,
  Shield,
  Sparkles,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import ProsGetAppCta from '../../components/pros/ProsGetAppCta';
import ProsPageHeader from '../../components/pros/ProsPageHeader';
import ProsFieldAiFeatures from '../../components/pros/ProsFieldAiFeatures';
import ProsPoweredByGrokVideo from '../../components/pros/ProsPoweredByGrokVideo';
import { DiagnoseWebProvider, useDiagnoseWeb, WEB_TRADE_PACK_LIST } from '../../context/DiagnoseWebContext';
import { PACK_ICONS } from './diagnoseWebShared';

function LandingCta() {
  const { user, signIn } = useDiagnoseWeb();
  const navigate = useNavigate();

  if (user) {
    return (
      <button
        type="button"
        onClick={() => navigate('/diagnose/app')}
        className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-8 py-4 text-lg"
      >
        Open Diagnose
        <ArrowRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signIn().then(() => navigate('/diagnose/app'))}
      className="inline-flex items-center gap-2 rounded-lg bg-[#F5A623] hover:bg-[#e09510] text-slate-900 font-bold px-8 py-4 text-lg"
    >
      Start free — $2 Hive credits
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}

function DiagnoseLandingInner() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <SEO
        title="AiBhive Diagnose — Field AI for trades (web)"
        description="Pool, electrical, plumbing, HVAC, fiber, and property maintenance diagnosis in your browser. Full RAG library plus Grok AI with $2 free Hive credits."
      />

      <ProsPageHeader variant="light" />

      <section className="py-16 sm:py-20 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#c47d0a] mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Same packs & RAG as the mobile app
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08]">
                Field diagnosis built for the desk —{' '}
                <span className="text-[#1E3A8A]">not a phone skin.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Six trade packs, 100+ fault playbooks, guided flows, reference charts, and live Grok reasoning.
                Sign in with Google and get <strong className="text-slate-900">$2 in Hive credits</strong> to test AI free.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LandingCta />
                <Link
                  to="/pros"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold px-6 py-4 text-slate-800"
                >
                  <Building2 className="w-5 h-5" />
                  Company accounts
                </Link>
                <a
                  href="/api/download/diagnose-apk"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold px-6 py-4 text-slate-800"
                >
                  Android app
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Included on web</p>
              <ul className="space-y-3 text-sm">
                {[
                  { icon: MessageSquare, label: 'Grok-powered diagnose chat with photo upload' },
                  { icon: BookOpen, label: 'Full offline fault library & error codes' },
                  { icon: Layers, label: 'Pool · Electrical · Property · Plumbing · HVAC · Fiber' },
                  { icon: Shield, label: 'Safety checklists & trade reference charts' },
                ].map((row) => (
                  <li key={row.label} className="flex items-start gap-3 text-slate-700">
                    <row.icon className="w-5 h-5 text-[#F5A623] shrink-0 mt-0.5" />
                    {row.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight text-center">Trade packs</h2>
          <p className="text-center text-slate-600 mt-3 max-w-2xl mx-auto">
            Each pack includes fault playbooks, RAG corpus, guided flows, and reference tools — identical to AiBhive Pros in the field.
          </p>
          <div className="grid lg:grid-cols-2 gap-8 mt-12 items-stretch">
            <div className="flex flex-col gap-6">
              <ProsPoweredByGrokVideo
                title="Powered by Grok & AiBhive AI"
                subtitle="Trade services intelligence — snap equipment, ask in plain English, get glove-friendly steps."
              />
              <ProsFieldAiFeatures />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {WEB_TRADE_PACK_LIST.map((pack) => {
                const Icon = PACK_ICONS[pack.icon] || Layers;
                return (
                  <div
                    key={pack.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm h-full"
                    style={{ borderColor: `${pack.accentColor}44` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${pack.accentColor}22` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: pack.accentColor }} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{pack.shortName}</p>
                        <p className="text-xs font-semibold" style={{ color: pack.accentColor }}>
                          {pack.tagline}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{pack.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight">Ready to troubleshoot?</h2>
          <p className="mt-4 text-slate-600">
            Pack library is always free. Live Grok uses Hive credits — $2 welcome credit on first sign-in.
          </p>
          <div className="mt-8">
            <LandingCta />
          </div>
        </div>
      </section>

      <ProsGetAppCta />
    </div>
  );
}

export default function DiagnoseWebLanding() {
  return (
    <DiagnoseWebProvider>
      <DiagnoseLandingInner />
    </DiagnoseWebProvider>
  );
}
