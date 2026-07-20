import { useState } from 'react';
import { ExternalLink, Leaf, Loader2, MapPin, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SHORT_NAME,
  MIN_RECHARGE_USD,
  STATE_CONTRIBUTION_USD,
} from '../../../lib/oregonPlantMedicine/branding';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import { builderUrlForState } from '../../../lib/oregonPlantMedicine/stateContribution';

type Props = {
  onClose: () => void;
  stateName?: string;
  city?: string;
};

export default function ContributeModal({ onClose, stateName, city }: Props) {
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

  const builderHref = stateName ? builderUrlForState(stateName, city) : '/hive-apps/build?q=' + encodeURIComponent(
    'Add new plants to Living Knowledge Plants and Medicine — same fields as the Oregon library (habitat, ID photos, look-alikes, edible/medicinal notes).',
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribute-modal-title"
    >
      <div className="bg-slate-950 border border-emerald-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative p-5 sm:p-6 border-b border-emerald-500/15 bg-gradient-to-br from-emerald-950/50 to-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
            {LIVING_KNOWLEDGE_SHORT_NAME}
          </p>
          <h2 id="contribute-modal-title" className="text-2xl font-black text-white mt-2 pr-10">
            Contribute to the living knowledge base
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Help grow {LIVING_KNOWLEDGE_APP_NAME}. Add as many plants as you like — each entry helps document Mother
            Earth&apos;s natural homeopathic remedies and wild edibles for everyone.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <Leaf className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Add as many plants as you like</p>
              <p className="mt-1 text-slate-300">
                Publish species entries with three ID photos, habitat, look-alikes, and preparation notes — the same depth
                as our Oregon seed library.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
            <MapPin className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-200">Add your state for ${STATE_CONTRIBUTION_USD}</p>
              <p className="mt-1 text-slate-300">
                New states (e.g. Washington) go live for the whole app. Your contribution is uploaded for everybody
                browsing that region.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">AiBhive Builder + Hive credits</p>
              <p className="mt-1 text-slate-300">
                Open states for <strong className="text-white">${STATE_CONTRIBUTION_USD}</strong>. Recharge anytime from{' '}
                <strong className="text-white">${MIN_RECHARGE_USD}</strong>. Builder prompts match the fields we used to
                author this database.
              </p>
            </div>
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(STATE_CONTRIBUTION_USD)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
            >
              {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {stateName ? `Add ${stateName}` : 'Add your state'} — ${STATE_CONTRIBUTION_USD}
            </button>
            <Link
              to={builderHref}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 text-emerald-200 font-bold px-4 py-3 text-sm hover:bg-emerald-500/10"
            >
              Open AiBhive Builder
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <button
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(MIN_RECHARGE_USD)}
              className="w-full text-slate-400 hover:text-white text-xs py-2"
            >
              Recharge from ${MIN_RECHARGE_USD}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
