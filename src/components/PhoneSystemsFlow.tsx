import { motion } from 'motion/react';
import { Phone, PhoneMissed, MessageSquare, Brain, CalendarCheck, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Phone,
    title: 'Inbound call or text',
    description: 'Prospect calls your business line or sends an SMS to your published number.',
  },
  {
    icon: PhoneMissed,
    title: 'Missed call detected',
    description: 'Your phone system (Twilio, RingCentral, OpenPhone, etc.) fires a webhook to AiBHive within seconds.',
  },
  {
    icon: MessageSquare,
    title: 'Instant intelligent text',
    description: 'A RAG-trained agent texts back using your scripts, listings, hours, and FAQs—personalized, not generic.',
  },
  {
    icon: Brain,
    title: 'Two-way conversation',
    description: 'The agent answers follow-ups, qualifies intent, and pulls facts from your private knowledge base.',
  },
  {
    icon: CalendarCheck,
    title: 'Appointment booked',
    description: 'Qualified leads receive booking links or get placed directly on your calendar via CRM integration.',
  },
];

export default function PhoneSystemsFlow() {
  return (
    <section className="mb-16 rounded-2xl border border-bee-amber/25 bg-gradient-to-br from-bee-amber/10 via-bee-black to-bee-black p-8 md:p-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-3">
          Missed call → booked appointment
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          How AiBHive connects to your phone & SMS stack
        </h2>
        <p className="text-slate-400 leading-relaxed">
          Every missed call is revenue walking away. We plug into the platforms you already use and
          respond with an AI agent trained on your business—not a static &quot;sorry we missed you&quot;
          template.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch justify-center gap-3 lg:gap-2">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col lg:flex-row items-center flex-1 min-w-0">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex-1 w-full rounded-xl border border-white/10 bg-bee-black/60 p-5 text-center lg:text-left"
            >
              <step.icon className="w-8 h-8 text-bee-amber mx-auto lg:mx-0 mb-3" aria-hidden />
              <h3 className="text-white font-bold text-sm mb-2">{step.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{step.description}</p>
            </motion.article>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className="w-5 h-5 text-bee-amber/50 my-2 lg:my-0 lg:mx-1 shrink-0 rotate-90 lg:rotate-0"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-slate-500 text-sm mt-8 max-w-2xl mx-auto">
        Compatible with major VoIP and CPaaS providers via webhooks and APIs. AiBHive does not replace
        your carrier—we make every call and text thread intelligent.
      </p>
    </section>
  );
}
