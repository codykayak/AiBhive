import { motion } from 'motion/react';
import { ArrowUpRight, Clock, TrendingUp, Wallet } from 'lucide-react';
import {
  ONLYFANS_REVENUE_CHART,
  ONLYFANS_REVENUE_FUNNEL,
  ONLYFANS_REVENUE_KPIS,
} from '../../pages/onlyfans/onlyfansLandingData';

const MAX_BAR = Math.max(
  ...ONLYFANS_REVENUE_CHART.flatMap((row) => [row.manual, row.withAi]),
);

export default function OnlyFansRevenueInfographic() {
  return (
    <section id="revenue-impact" className="py-20 sm:py-28 border-y border-white/5 bg-gradient-to-b from-fuchsia-950/15 to-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">Revenue impact</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            AI chatbots don&apos;t replace you —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-200">
              they multiply what you already sell.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Slow replies leak money every hour. Programmable fan chat keeps the inbox warm, sends PPV at peak intent,
            and turns the same vault into higher monthly revenue — without you living in DMs.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mb-10">
          {ONLYFANS_REVENUE_KPIS.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <kpi.icon className="w-5 h-5 text-pink-300" />
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {kpi.delta}
                </span>
              </div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-pink-500/20 bg-black/50 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="font-bold text-lg text-white">Monthly creator revenue</h3>
                <p className="text-sm text-slate-400 mt-1">Same content vault — manual inbox vs AI-assisted chat</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-3 h-3 rounded-sm bg-slate-600" />
                  Manual DMs
                </span>
                <span className="flex items-center gap-2 text-pink-200">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-pink-600 to-fuchsia-400" />
                  With AiBhive chat
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {ONLYFANS_REVENUE_CHART.map((row) => (
                <div key={row.month} className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4rem_1fr] gap-3 items-center">
                  <span className="text-xs font-bold text-slate-500">{row.month}</span>
                  <div className="space-y-2">
                    <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(row.manual / MAX_BAR) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute inset-y-0 left-0 rounded-full bg-slate-600/80"
                      />
                    </div>
                    <div className="relative h-4 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(row.withAi / MAX_BAR) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>${row.manual.toLocaleString()} manual</span>
                      <span className="text-pink-200 font-bold">${row.withAi.toLocaleString()} with AI</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-500 border-t border-white/5 pt-4">
              Illustrative beta benchmark from agency onboarding data: faster replies + timed PPV lifts attach rate and
              renewals. Your vault and audience determine actual results.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h3 className="font-bold text-lg text-white mb-2">Where the money comes from</h3>
            <p className="text-sm text-slate-400 mb-6">AI chat closes the gaps manual inboxes miss.</p>
            <div className="space-y-4">
              {ONLYFANS_REVENUE_FUNNEL.map((step, i) => (
                <div key={step.title} className="relative pl-4 border-l-2 border-pink-500/30">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="font-bold text-sm text-white">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.detail}</p>
                  <p className="text-xs font-bold text-emerald-300 mt-2">{step.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 flex gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-white">+38% avg revenue lift</p>
              <p className="text-xs text-slate-400 mt-1">After 90 days with scripted PPV + 24/7 coverage</p>
            </div>
          </div>
          <div className="rounded-2xl border border-pink-500/20 bg-pink-500/[0.06] p-4 flex gap-3">
            <Clock className="w-5 h-5 text-pink-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-white">&lt; 2 min reply time</p>
              <p className="text-xs text-slate-400 mt-1">Fans buy when intent is hot — not hours later</p>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 flex gap-3">
            <Wallet className="w-5 h-5 text-amber-200 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-white">Same vault, more turns</p>
              <p className="text-xs text-slate-400 mt-1">You shoot once — the bot sells the library on repeat</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
