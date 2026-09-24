import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Building2, Home, MessageSquare, PhoneCall } from 'lucide-react';
import { BOOK_CONSULTATION_PATH } from '../constants/navigation';

const OFFERINGS = [
  {
    title: 'Multifamily & property management',
    body:
      'ManyDoors AI is the operations layer on the PMS you already run — 24/7 resident messaging, leasing speed-to-lead, maintenance triage, and owner-grade NOI reporting. No rip-and-replace.',
    href: 'https://manydoorsai.com',
    external: true,
    cta: 'Explore ManyDoors AI',
    icon: Building2,
  },
  {
    title: 'Real estate investors & agents',
    body:
      'Distress and farm workflows, CRM sync, missed-call text-back, and RAG-trained SMS that sound like your buy box — book seller and buyer appointments around the clock.',
    href: '/solutions/real-estate-ai-automation',
    external: false,
    cta: 'Real estate automation',
    icon: Home,
  },
  {
    title: 'Lead generation & nurture',
    body:
      'Autonomous agents qualify inbound and outbound leads, pace outreach to protect deliverability, and hand hot conversations to your team with full context.',
    href: '/solutions/ai-lead-generation-automation',
    external: false,
    cta: 'Lead gen agents',
    icon: MessageSquare,
  },
  {
    title: 'Phone & SMS intelligence',
    body:
      'Integrate Twilio, RingCentral, OpenPhone, or field SMS — every missed call gets an intelligent, compliance-aware reply trained on your listings and scripts.',
    href: '/solutions/phone-systems-ai-integration',
    external: false,
    cta: 'Phone & SMS stack',
    icon: PhoneCall,
  },
] as const;

export default function HomePropertySolutions() {
  return (
    <section className="relative bg-[#070a0f] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-10 md:mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-bee-amber flex items-center justify-center">
              <Building2 className="w-6 h-6 text-bee-black" />
            </div>
            <div>
              <p className="text-bee-amber text-xs font-bold uppercase tracking-widest">
                Property & real estate
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Multifamily and real estate AI that keeps working after hours
              </h2>
            </div>
          </div>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            AiBhive deploys agentic workflows for operators, investors, and brokerages — from portfolio-scale
            resident and leasing automation through ManyDoors AI to distressed-owner outreach, CRM sync, and
            booked appointments on your calendar. One platform for multifamily NOI and speed-to-lead in
            residential real estate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-8 md:mb-10">
          {OFFERINGS.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <>
                <Icon className="w-7 h-7 text-bee-amber shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-lg md:text-xl">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">{item.body}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-bee-amber font-bold text-sm">
                    {item.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </>
            );
            const className =
              'w-full h-full flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7 hover:border-bee-amber/30 hover:bg-white/[0.05] transition-all';

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {inner}
                  </a>
                ) : (
                  <Link to={item.href} className={className}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Link
            to={BOOK_CONSULTATION_PATH}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-bee-amber p-6 md:p-8 hover:bg-bee-yellow transition-colors text-bee-black font-extrabold text-lg"
          >
            Book a property & real estate audit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/tools/real-estate-ai"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 hover:border-bee-amber/30 transition-colors text-white font-extrabold text-lg"
          >
            Free real estate AI tools
            <ArrowRight className="w-5 h-5 text-bee-amber" />
          </Link>
        </div>
      </div>
    </section>
  );
}
