import { MapPin } from 'lucide-react';
import { STATE_CONTRIBUTION_USD } from '../../../lib/oregonPlantMedicine/branding';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import { useState } from 'react';

type Props = {
  onClose: () => void;
  stateName?: string;
};

/** State map contribution only — community posts use the Create Post form. */
export default function ContributeModal({ onClose, stateName }: Props) {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');

  const buyCredits = async () => {
    setCheckoutBusy(true);
    setError('');
    try {
      const url = await startLivingKnowledgeCreditsCheckout(STATE_CONTRIBUTION_USD);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-sky-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h2 className="text-xl font-black text-white">Add your state to the map</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Open {stateName ?? 'your state'} on the living knowledge map for ${STATE_CONTRIBUTION_USD} in Hive credits.
          Browsing, search, and community posts stay free.
        </p>
        {error ? <p className="text-xs text-red-300 mt-3">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void buyCredits()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
          >
            <MapPin className="w-4 h-4" />
            {stateName ? `Add ${stateName}` : 'Add your state'} — ${STATE_CONTRIBUTION_USD}
          </button>
          <button type="button" onClick={onClose} className="w-full text-slate-500 hover:text-white text-sm py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
