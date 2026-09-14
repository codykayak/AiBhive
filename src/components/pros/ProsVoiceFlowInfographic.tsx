import { ArrowRight, CalendarCheck, Moon, PhoneIncoming, Radio, Siren } from 'lucide-react';

type Props = {
  className?: string;
  variant?: 'light' | 'dark';
};

const STEPS = [
  { icon: PhoneIncoming, label: 'Call or Talk', detail: 'Customer reaches your shop line or browser Talk' },
  { icon: Radio, label: 'AiBhive Voice', detail: 'Captures issue, trade, urgency, and contact info' },
  { icon: CalendarCheck, label: 'Book or queue', detail: 'Sets appointments or adds to the morning dispatch board' },
  { icon: Siren, label: 'Escalate', detail: 'True emergencies flagged for after-hours callback' },
];

export default function ProsVoiceFlowInfographic({ className = '', variant = 'light' }: Props) {
  const dark = variant === 'dark';

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'
      } ${className}`}
      aria-label="How AiBhive Voice handles service calls"
    >
      <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${dark ? 'text-amber-300' : 'text-amber-700'}`}>
        Call flow
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative flex gap-3 items-start">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  dark ? 'bg-amber-500/20 text-amber-300' : 'bg-[#1E3A8A]/10 text-[#1E3A8A]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{step.label}</div>
                <p className={`text-xs mt-1 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step.detail}
                </p>
              </div>
              {i < STEPS.length - 1 && i % 2 === 0 ? (
                <ArrowRight
                  className={`hidden lg:block absolute -right-1 top-3 w-4 h-4 ${
                    dark ? 'text-slate-600' : 'text-slate-300'
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div
        className={`mt-5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
          dark ? 'bg-slate-900/50 text-slate-300' : 'bg-amber-50 text-amber-900'
        }`}
      >
        <Moon className="w-4 h-4 shrink-0" />
        Nights and weekends: separates emergencies from can-wait-till-Monday
      </div>
    </div>
  );
}
