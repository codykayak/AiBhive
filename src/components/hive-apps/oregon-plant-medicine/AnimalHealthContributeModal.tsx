import { useState } from 'react';
import { ExternalLink, Loader2, PawPrint, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ANIMAL_HEALTH_CONTRIBUTION_USD,
  ANIMAL_HEALTH_TAB_LABEL,
  LIVING_KNOWLEDGE_SHORT_NAME,
  MIN_RECHARGE_USD,
} from '../../../lib/oregonPlantMedicine/branding';
import { builderUrlForAnimalHealthTopic } from '../../../lib/oregonPlantMedicine/animalHealthContribution';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';

type Props = {
  onClose: () => void;
  topicTitle?: string;
};

export default function AnimalHealthContributeModal({ onClose, topicTitle }: Props) {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');

  const buyCredits = async (amountUsd: number) => {
    setCheckoutBusy(true);
    setError('');
    try {
      const url = await startLivingKnowledgeCreditsCheckout(amountUsd);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutBusy(false);
    }
  };

  const builderHref = builderUrlForAnimalHealthTopic(topicTitle);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-rose-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative p-5 sm:p-6 border-b border-rose-500/15 bg-gradient-to-br from-rose-950/50 to-slate-950">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-400">{LIVING_KNOWLEDGE_SHORT_NAME}</p>
          <h2 className="text-2xl font-black text-white mt-2 pr-10">Add animal health research</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Publish a new topic to <strong className="text-white">{ANIMAL_HEALTH_TAB_LABEL}</strong> for the whole community.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="flex gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
            <PawPrint className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Add research for ${ANIMAL_HEALTH_CONTRIBUTION_USD}</p>
              <p className="mt-1">Educational tone, safety warnings, Wikimedia hero image, and 250–500 word deep dive.</p>
            </div>
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(ANIMAL_HEALTH_CONTRIBUTION_USD)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
            >
              {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {topicTitle ? `Add "${topicTitle}"` : 'Add animal health research'} — ${ANIMAL_HEALTH_CONTRIBUTION_USD}
            </button>
            <Link
              to={builderHref}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 text-rose-200 font-bold px-4 py-3 text-sm hover:bg-rose-500/10"
            >
              Open AiBhive Builder
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <button type="button" disabled={checkoutBusy} onClick={() => void buyCredits(MIN_RECHARGE_USD)} className="w-full text-slate-400 hover:text-white text-xs py-2">
              Recharge from ${MIN_RECHARGE_USD}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
