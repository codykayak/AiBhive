import { ExternalLink, HeartPulse, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HOLISTIC_TAB_LABEL, LIVING_KNOWLEDGE_SHORT_NAME } from '../../../lib/oregonPlantMedicine/branding';
import { builderUrlForHolisticTopic } from '../../../lib/oregonPlantMedicine/holisticContribution';

type Props = {
  onClose: () => void;
  topicTitle?: string;
};

export default function HolisticContributeModal({ onClose, topicTitle }: Props) {
  const builderHref = builderUrlForHolisticTopic(topicTitle);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-violet-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative p-5 sm:p-6 border-b border-violet-500/15 bg-gradient-to-br from-violet-950/50 to-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">
            {LIVING_KNOWLEDGE_SHORT_NAME}
          </p>
          <h2 className="text-2xl font-black text-white mt-2 pr-10">Add holistic research</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Publish a new topic to <strong className="text-white">{HOLISTIC_TAB_LABEL}</strong> — free via AiBhive
            Builder.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="flex gap-3 rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
            <HeartPulse className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-violet-200">Free to publish</p>
              <p className="mt-1">
                Opens a pre-filled Builder prompt matching our HolisticTopic template — educational tone, safety
                warnings, plant cross-links, and vetted sources.
              </p>
            </div>
          </div>

          <Link
            to={builderHref}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-3 text-sm"
          >
            {topicTitle ? `Open Builder — "${topicTitle}"` : 'Open AiBhive Builder'}
            <ExternalLink className="w-4 h-4 opacity-90" />
          </Link>
        </div>
      </div>
    </div>
  );
}
