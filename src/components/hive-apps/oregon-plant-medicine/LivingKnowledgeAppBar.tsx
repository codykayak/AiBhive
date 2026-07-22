import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Download, Loader2, Sparkles } from 'lucide-react';
import {
  GROK_CREDITS_SIGNUP_USD,
  PLANT_APP_DISPLAY_NAME,
} from '../../../lib/oregonPlantMedicine/branding';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';

type Props = {
  user?: User | null;
  onSignIn?: () => void;
};

/** Sticky bottom bar — Hive credits for Grok + Android APK download. */
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
      const url = await startLivingKnowledgeCreditsCheckout(GROK_CREDITS_SIGNUP_USD);
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
            Enable Grok search &amp; photo ID
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Add ${GROK_CREDITS_SIGNUP_USD} in Hive credits to unlock Ask AI and photo plant identification on{' '}
            {PLANT_APP_DISPLAY_NAME}. Browsing the library stays free.
          </p>
          {error ? <p className="text-[11px] text-amber-300 mt-1">{error}</p> : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void buyCredits()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-3"
          >
            {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {user ? `Buy $${GROK_CREDITS_SIGNUP_USD} Hive credits` : `Sign in — $${GROK_CREDITS_SIGNUP_USD} credits`}
          </button>
          <a
            href="/api/download/apk"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 hover:border-emerald-500/40 text-slate-200 font-bold text-sm px-5 py-3"
          >
            <Download className="w-4 h-4" />
            Download APK
          </a>
        </div>
      </div>
    </div>
  );
}
