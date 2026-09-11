import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { ONLYFANS_MIDPAGE_COPY, ONLYFANS_MIDPAGE_IMAGE } from '../../pages/onlyfans/onlyfansLandingData';

export default function OnlyFansMidPageShowcase() {
  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-pink-500/20 via-fuchsia-500/10 to-transparent rounded-[2rem] blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden border border-pink-500/25 shadow-2xl shadow-pink-500/10">
              <img
                src={ONLYFANS_MIDPAGE_IMAGE}
                alt="Creator shooting content while AI chat handles fan messages and sales notifications on phone"
                className="w-full aspect-[16/10] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0610]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
                <p className="text-xs font-bold text-pink-200 uppercase tracking-wider">Live while you shoot</p>
                <p className="text-sm text-white mt-1">3 PPV sends · 12 fan replies · $847 pending — last hour</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <p className="text-pink-400 text-xs font-black uppercase tracking-widest mb-3">
              {ONLYFANS_MIDPAGE_COPY.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {ONLYFANS_MIDPAGE_COPY.title}
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">{ONLYFANS_MIDPAGE_COPY.body}</p>
            <ul className="mt-8 space-y-3">
              {ONLYFANS_MIDPAGE_COPY.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
