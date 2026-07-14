import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Cable,
  Droplets,
  Layers,
  MessageSquare,
  Shield,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { DiagnoseWebProvider, useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { WEB_TRADE_PACK_LIST } from '../../context/DiagnoseWebContext';

const PACK_ICONS = {
  waves: Droplets,
  zap: Zap,
  wrench: Layers,
  droplets: Droplets,
  wind: Wind,
  cable: Cable,
} as const;

function LandingCta() {
  const { user, signIn } = useDiagnoseWeb();
  const navigate = useNavigate();

  if (user) {
    return (
      <button
        type="button"
        onClick={() => navigate('/diagnose/app')}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-black font-extrabold text-lg hover:bg-amber-400 transition-colors"
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
      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-black font-extrabold text-lg hover:bg-amber-400 transition-colors"
    >
      Start free — $2 Hive credits
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}

function DiagnoseLandingInner() {
  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100">
      <SEO
        title="AiBhive Diagnose Web — Field AI for trades"
        description="Pool, electrical, plumbing, HVAC, fiber, and property maintenance diagnosis in your browser. Full RAG library plus Grok AI with $2 free Hive credits."
      />

      <header className="border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">AiBhive Diagnose</p>
            <p className="text-white font-black text-xl">Web workstation</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pros" className="text-sm text-slate-400 hover:text-white hidden sm:inline">
              Pros HQ
            </Link>
            <Link
              to="/api/download/diagnose-apk"
              className="text-sm font-bold text-amber-400 px-4 py-2 rounded-xl border border-amber-500/30 hover:bg-amber-500/10"
            >
              Android app
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              Same packs & RAG as the mobile app
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Field diagnosis built for the desk — not a phone skin.
            </h1>
            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              Six trade packs, 100+ fault playbooks, guided flows, reference charts, and live Grok reasoning.
              Sign in with Google and get <strong className="text-white">$2 in Hive credits</strong> to test AI free.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LandingCta />
              <Link
                to="/pros"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/15 text-white font-bold hover:bg-white/5"
              >
                <Building2 className="w-5 h-5" />
                Company accounts
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1018] p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Included on web</p>
            <ul className="space-y-3 text-sm">
              {[
                { icon: MessageSquare, label: 'Grok-powered diagnose chat with photo upload' },
                { icon: BookOpen, label: 'Full offline fault library & error codes' },
                { icon: Layers, label: 'Pool · Electrical · Property · Plumbing · HVAC · Fiber' },
                { icon: Shield, label: 'Safety checklists & trade reference charts' },
              ].map((row) => (
                <li key={row.label} className="flex items-start gap-3 text-slate-300">
                  <row.icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  {row.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#0a0e16] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-black text-white mb-8">Trade packs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEB_TRADE_PACK_LIST.map((pack) => {
              const Icon = PACK_ICONS[pack.icon] || Layers;
              return (
                <div
                  key={pack.id}
                  className="rounded-2xl border border-white/10 bg-[#070a10] p-5"
                  style={{ borderColor: `${pack.accentColor}33` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${pack.accentColor}22` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: pack.accentColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{pack.shortName}</p>
                      <p className="text-xs text-slate-500">{pack.tagline}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{pack.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-white">Ready to troubleshoot?</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">
          Pack library is always free. Live Grok uses Hive credits — $2 welcome credit on first sign-in.
        </p>
        <div className="mt-8">
          <LandingCta />
        </div>
      </section>
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
