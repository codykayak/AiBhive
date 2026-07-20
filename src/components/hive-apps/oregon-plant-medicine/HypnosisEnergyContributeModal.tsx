import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HYPNOSIS_ENERGY_TAB_LABEL, LIVING_KNOWLEDGE_SHORT_NAME } from '../../../lib/oregonPlantMedicine/branding';
import { builderUrlForHypnosisEnergyTopic } from '../../../lib/oregonPlantMedicine/hypnosisEnergyContribution';

type Props = {
  onClose: () => void;
  topicTitle?: string;
};

export default function HypnosisEnergyContributeModal({ onClose, topicTitle }: Props) {
  const builderHref = builderUrlForHypnosisEnergyTopic(topicTitle);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-cyan-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative p-5 sm:p-6 border-b border-cyan-500/15 bg-gradient-to-br from-cyan-950/50 to-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
            {LIVING_KNOWLEDGE_SHORT_NAME}
          </p>
          <h2 className="text-2xl font-black text-white mt-2 pr-10">Add hypnosis &amp; energy research</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Publish to <strong className="text-white">{HYPNOSIS_ENERGY_TAB_LABEL}</strong> — free via AiBhive Builder.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="flex gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
            <Sparkles className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-cyan-200">Free to publish</p>
              <p className="mt-1">
                Educational tone, safety warnings, and vetted sources — same template as our seed library.
              </p>
            </div>
          </div>

          <Link
            to={builderHref}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-3 text-sm"
          >
            {topicTitle ? `Open Builder — "${topicTitle}"` : 'Open AiBhive Builder'}
            <ExternalLink className="w-4 h-4 opacity-90" />
          </Link>
        </div>
      </div>
    </div>
  );
}
