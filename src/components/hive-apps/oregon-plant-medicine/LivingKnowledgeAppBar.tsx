import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Download, Loader2, Sparkles } from 'lucide-react';
import {
  BHIVE_CREDITS_SIGNUP_USD,
  HIVE_RESEARCH_LABEL,
  HIVE_RESEARCH_POWERED_BY,
  PLANT_APP_DISPLAY_NAME,
} from '../../../lib/oregonPlantMedicine/branding';
import LivingKnowledgeSocialShare from './LivingKnowledgeSocialShare';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';

type Props = {
  user?: User | null;
  onSignIn?: () => void;
};

/** Sticky bottom bar — Hive Research credits + Android APK download. */
export default function LivingKnowledgeAppBar({ user, onSignIn }: Props) {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');

  const buyCredits = async () => {
    if (!user) {
      onSignIn?.();
      return;
    }
    setCheckoutBusy(true);
    setError('');
    try {
      const url = await startLivingKnowledgeCreditsCheckout(BHIVE_CREDITS_SIGNUP_USD);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="border-t border-emerald-500/25 bg-gradient-to-r from-emerald-950/90 via-slate-950 to-violet-950/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Enable {HIVE_RESEARCH_LABEL} &amp; photo ID
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Add ${BHIVE_CREDITS_SIGNUP_USD} in Bhive Credits to unlock {HIVE_RESEARCH_LABEL} and photo plant
            identification on {PLANT_APP_DISPLAY_NAME}. {HIVE_RESEARCH_POWERED_BY}. Browsing the library stays free.
          </p>
          {error ? <p className="text-[11px] text-amber-300 mt-1">{error}</p> : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto sm:items-center">
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void buyCredits()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-3"
          >
            {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {user ? `Buy $${BHIVE_CREDITS_SIGNUP_USD} Bhive Credits` : `Sign in — $${BHIVE_CREDITS_SIGNUP_USD} credits`}
          </button>
          <div className="flex flex-col gap-1">
            <a
              href="/api/download/plants-apk"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 hover:border-emerald-500/40 text-slate-200 font-bold text-sm px-5 py-3"
            >
              <Download className="w-4 h-4" />
              Download Android APK
            </a>
            <p className="text-[10px] text-slate-500 text-center sm:text-right leading-snug px-1">
              Google Play approval pending — install directly while we wait for the store listing.
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-4 border-t border-white/5 pt-3">
        <LivingKnowledgeSocialShare />
      </div>
    </div>
  );
}
