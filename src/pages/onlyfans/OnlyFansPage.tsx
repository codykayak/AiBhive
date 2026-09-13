import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
  DollarSign,
  MessageCircleHeart,
  Sparkles,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import OnlyFansPageHeader from '../../components/onlyfans/OnlyFansPageHeader';
import OnlyFansMidPageShowcase from '../../components/onlyfans/OnlyFansMidPageShowcase';
import OnlyFansRevenueInfographic from '../../components/onlyfans/OnlyFansRevenueInfographic';
import {
  ONLYFANS_COMPLIANCE_BULLETS,
  ONLYFANS_FAQS,
  ONLYFANS_FEATURES,
  ONLYFANS_FLOW,
  ONLYFANS_HERO_SUB,
  ONLYFANS_ROADMAP,
  ONLYFANS_STATS,
  ONLYFANS_TAGLINE,
} from './onlyfansLandingData';

const HERO_IMAGE = '/onlyfans/hero-cash.png';

export default function OnlyFansPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0a0610] text-white">
      <SEO
        title="AiBhive Creator Chat — OnlyFans AI that prints money while you shoot"
        description="Programmable fan chat for OnlyFans creators: answer 90% of DMs, send PPV at the perfect moment, and turn your photo vault into revenue. You take the pictures — we handle the inbox."
        keywords="OnlyFans AI chatbot, creator automation, PPV automation, fan chat AI, OnlyFans agency tools, programmable creator bot, Fanvue AI chat"
        type="SoftwareApplication"
        applicationCategory="BusinessApplication"
        featureList={[
          'Programmable creator persona',
          'Timed PPV and media sends',
          'Fan segmentation and memory',
          'Human-in-the-loop approval',
        ]}
        faqs={ONLYFANS_FAQS}
        image={HERO_IMAGE}
      />

      <OnlyFansPageHeader />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0610] via-[#0a0610]/85 to-[#0a0610]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0610] via-transparent to-[#0a0610]/60" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-28 sm:py-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-pink-200 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              For OnlyFans &amp; creator platforms
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              {ONLYFANS_TAGLINE.split('. ').map((line, i) => (
                <span key={i} className={i === 1 ? 'block text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-fuchsia-300 to-amber-200' : 'block'}>
                  {line}{i === 0 ? '.' : ''}
                </span>
              ))}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed">{ONLYFANS_HERO_SUB}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/book-consultation"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-bold px-7 py-3.5 shadow-xl shadow-pink-500/30"
              >
                <DollarSign className="w-5 h-5" />
                Request beta access
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur font-bold px-6 py-3.5"
              >
                See how it works
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Built by AiBhive — programmable agents, not a generic ChatGPT wrapper.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {ONLYFANS_STATS.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-black text-pink-300">{s.value}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">Why creators switch</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Your content library is an ATM.{' '}
              <span className="text-slate-400">The inbox is the PIN.</span>
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Most money is lost in slow replies, wrong timing, and repetitive questions — not bad photos. We fix the
              conversation layer so every shoot keeps paying.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ONLYFANS_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-pink-500/30 hover:bg-pink-500/[0.04] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-pink-300" />
                </div>
                <h3 className="font-bold text-lg text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <OnlyFansMidPageShowcase />

      <OnlyFansRevenueInfographic />

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-gradient-to-b from-pink-950/20 to-transparent border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
            <div>
              <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Shoot content. We run the printer.</h2>
            </div>
            <MessageCircleHeart className="w-12 h-12 text-pink-500/40 hidden sm:block" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ONLYFANS_FLOW.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-pink-500/20 bg-black/40 p-6"
              >
                <span className="text-4xl font-black text-pink-500/30">{step.step}</span>
                <h3 className="mt-3 font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">Built for real accounts</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Print money — don&apos;t gamble your account.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              The creator economy runs on trust. We engineer for the compliance shape agencies actually use: human
              oversight, truth boundaries, and audit trails — not &quot;set and forget&quot; impersonation.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {ONLYFANS_COMPLIANCE_BULLETS.map((b) => (
              <div key={b.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-fuchsia-500/15 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-fuchsia-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{b.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 sm:py-28 border-t border-white/5 bg-black/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">Product roadmap</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-12">What we&apos;re building first</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ONLYFANS_ROADMAP.map((phase) => (
              <div key={phase.phase} className="rounded-2xl border border-pink-500/25 bg-pink-500/[0.04] p-6">
                <h3 className="font-bold text-pink-200">{phase.phase}</h3>
                <ul className="mt-4 space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-pink-400 shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black tracking-tight mb-10 text-center">Questions creators ask</h2>
          <div className="space-y-3">
            {ONLYFANS_FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="rounded-xl border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03]"
                  >
                    <span className="font-bold text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 text-pink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open ? (
                    <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 border-t border-pink-500/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to turn DMs into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-200">revenue</span>?
          </h2>
          <p className="mt-4 text-slate-400">
            Early access is limited. Tell us your niche, vault size, and team setup — we&apos;ll map a beta plan.
          </p>
          <Link
            to="/book-consultation"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-bold px-8 py-4 text-lg shadow-xl shadow-pink-500/30"
          >
            Book a creator consult
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-xs text-slate-600">
            AiBhive Creator Chat is independent of OnlyFans Inc. Platform names are used descriptively only.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600">
        <Link to="/" className="hover:text-slate-400">
          ← Back to AiBhive.com
        </Link>
      </footer>
    </div>
  );
}
