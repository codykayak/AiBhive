import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart3,
  Check,
  ClipboardCheck,
  Clock,
  MapPin,
  Package,
  Radio,
  Send,
  Signal,
  Sparkles,
  Users,
} from 'lucide-react';

const INCLUDED_FEATURES = [
  {
    icon: Clock,
    title: 'Clock in & out / GPS time tracking',
    body: 'Know when techs start and finish — periodic GPS check-ins when tracking is enabled.',
  },
  {
    icon: Send,
    title: 'Job dispatch & acceptance',
    body: 'Manager assigns → tech accepts from the field app. No more text-thread chaos.',
  },
  {
    icon: MapPin,
    title: 'Job status pipeline',
    body: 'On the way · on site · in progress — everyone sees the same live status.',
  },
  {
    icon: ClipboardCheck,
    title: 'Digital work orders',
    body: 'View, update, and sign off on jobs with notes, photos, and field documentation.',
  },
  {
    icon: Package,
    title: 'Smart parts ordering',
    body: 'Order parts from the truck with job context — fewer return trips.',
  },
  {
    icon: BarChart3,
    title: 'Weekly reports',
    body: 'Techs and managers get summaries of jobs completed, activity, and shop momentum.',
  },
  {
    icon: Signal,
    title: 'Offline mode',
    body: 'Works with no signal — the full fix-it library and work orders sync when you reconnect.',
  },
] as const;

const PLANS = [
  {
    id: 'solo',
    name: 'Individual Tech',
    price: '$59',
    period: '/mo',
    seats: 'Solo technicians',
    detail: 'All 8 trade packs',
    icon: Sparkles,
    featured: false,
  },
  {
    id: 'crew',
    name: 'Crew',
    price: '$149',
    period: '/mo',
    seats: '3–5 techs',
    detail: 'Full Pros HQ + Diagnose for every seat',
    icon: Users,
    featured: true,
  },
  {
    id: 'mid',
    name: 'Mid-Size',
    price: '$299',
    period: '/mo',
    seats: '6–15 techs',
    detail: 'Dispatch, GPS, knowledge base & reports',
    icon: Radio,
    featured: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: '$499+',
    period: '/mo',
    seats: '15+ techs',
    detail: 'Includes custom build for your company',
    icon: Check,
    featured: false,
  },
] as const;

export default function ProsPricingSection() {
  return (
    <section id="pricing" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">Plans &amp; features</p>
          <h2 className="text-3xl font-black tracking-tight mt-2">Everything your shop runs on</h2>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Field AI, dispatch, work orders, parts, and reporting — one platform from the truck to the office.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mt-12 items-start">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Included in every plan</h3>
            <ul className="space-y-4">
              {INCLUDED_FEATURES.map((feature, i) => (
                <motion.li
                  key={feature.title}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-[#1E3A8A]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{feature.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{feature.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Monthly pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLANS.map((plan, i) => {
                const Icon = plan.icon;
                return (
                  <motion.article
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={`relative rounded-2xl border p-5 flex flex-col h-full ${
                      plan.featured
                        ? 'border-[#F5A623] bg-amber-50/60 shadow-md ring-1 ring-[#F5A623]/30'
                        : 'border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    {plan.featured ? (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-[#F5A623] text-slate-900 px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    ) : null}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          plan.featured ? 'bg-[#F5A623]/25' : 'bg-[#1E3A8A]/10'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${plan.featured ? 'text-amber-700' : 'text-[#1E3A8A]'}`} />
                      </div>
                      <h4 className="font-black text-slate-900">{plan.name}</h4>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                      <span className="text-sm text-slate-500 font-semibold">{plan.period}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-2">{plan.seats}</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed flex-1">{plan.detail}</p>
                  </motion.article>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Hive credits for live Grok AI are billed separately at platform rates. Contact us for annual billing or
              enterprise SLAs on Custom plans.
            </p>
            <Link
              to="/pros/app"
              className="inline-flex items-center justify-center gap-2 mt-6 w-full sm:w-auto rounded-lg bg-[#1E3A8A] hover:bg-[#172f6e] text-white font-bold px-6 py-3.5"
            >
              Start company HQ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
