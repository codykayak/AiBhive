import { AlertTriangle, BookOpen, FileText, MapPin } from 'lucide-react';
import { LIVING_KNOWLEDGE_APP_NAME } from '../../../lib/oregonPlantMedicine/branding';

export type FooterView = 'guide' | 'resources' | null;

type Props = {
  activeView: FooterView;
  onNavigate: (view: FooterView) => void;
  onShowHolisticDisclaimer: () => void;
  onShowHypnosisDisclaimer: () => void;
  onShowAnimalDisclaimer: () => void;
};

export default function LivingKnowledgeFooter({
  activeView,
  onNavigate,
  onShowHolisticDisclaimer,
  onShowHypnosisDisclaimer,
  onShowAnimalDisclaimer,
}: Props) {
  const linkClass = (view: FooterView) =>
    `text-xs font-bold transition-colors ${
      activeView === view ? 'text-emerald-300' : 'text-slate-400 hover:text-emerald-200'
    }`;

  return (
    <footer className={`border-t border-emerald-500/20 bg-slate-950/80 ${activeView ? 'mt-8' : 'mt-6'}`}>
      <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto space-y-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Reference &amp; legal</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <button type="button" onClick={() => onNavigate('guide')} className={linkClass('guide')}>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Field guide
              </span>
            </button>
            <button type="button" onClick={() => onNavigate('resources')} className={linkClass('resources')}>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Resources
              </span>
            </button>
            <button
              type="button"
              onClick={onShowHolisticDisclaimer}
              className="text-xs font-bold text-slate-400 hover:text-violet-300 transition-colors"
            >
              Holistic disclaimer
            </button>
            <button
              type="button"
              onClick={onShowHypnosisDisclaimer}
              className="text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Hypnosis &amp; energy disclaimer
            </button>
            <button
              type="button"
              onClick={onShowAnimalDisclaimer}
              className="text-xs font-bold text-slate-400 hover:text-rose-300 transition-colors"
            >
              Animal health disclaimer
            </button>
          </nav>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-slate-400 leading-relaxed space-y-2">
          <p className="font-bold text-amber-200/90 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Educational use only
          </p>
          <p>
            {LIVING_KNOWLEDGE_APP_NAME} is a community field guide and research library — not medical advice,
            telehealth, or licensed therapy.             Never eat a wild plant or mushroom without 100% identification. Oregon /
            Washington / California Poison Control: <strong className="text-slate-300">1-800-222-1222</strong>. Mental health crisis
            (US): <strong className="text-slate-300">988</strong>.
          </p>
          <p className="flex items-center gap-1.5 text-slate-500">
            <FileText className="w-3 h-3" />
            Holistic, hypnosis, and animal health sections require a one-time hold-document acceptance per account.
            Use the disclaimer links above to read them again anytime.
          </p>
        </div>
      </div>
    </footer>
  );
}
