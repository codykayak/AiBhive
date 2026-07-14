import {
  Brain,
  CalendarClock,
  MessageSquare,
  SearchX,
  Signal,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Grok 1.5 Trillion Parameters',
    body: 'One of the largest and most powerful AI models in the world — always updated to the latest released version.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time field chat',
    body: 'Solve problems in the field with live chat — voice, photo, or text while you work.',
  },
  {
    icon: Signal,
    title: 'Offline mode',
    body: 'Works out of cell signal range. The most extensive local fix-it and install app library for tradespeople ever created.',
  },
  {
    icon: SearchX,
    title: 'No more YouTube searching',
    body: 'Just ask the app — glove-friendly steps tuned for the truck, not a 20-minute video.',
  },
  {
    icon: Brain,
    title: 'Train it on your equipment',
    body: 'The app learns as your techs contribute to the knowledge base — your manuals, fixes, and field notes.',
  },
  {
    icon: CalendarClock,
    title: 'Admin Portal',
    body: 'Schedule jobs · order parts · GPS tracking · add company spec manuals and tutorials.',
  },
] as const;

type Props = {
  className?: string;
};

export default function ProsFieldAiFeatures({ className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm ${className}`}>
      <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
        AI for the field Techs has arrived!
      </h3>
      <ul className="mt-5 space-y-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
              <feature.icon className="w-4 h-4 text-[#1E3A8A]" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">{feature.title}</p>
              <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{feature.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
