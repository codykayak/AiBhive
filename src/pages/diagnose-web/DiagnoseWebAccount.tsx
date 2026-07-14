import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Coins, Loader2, LogOut, Sparkles } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { startCreditsCheckout } from '../../lib/diagnoseWeb/api';

export default function DiagnoseWebAccount() {
  const { user, account, refreshAccount, signOutUser, idToken } = useDiagnoseWeb();
  const [searchParams] = useSearchParams();
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get('credits') === 'added') void refreshAccount();
  }, [searchParams, refreshAccount]);

  const balance = account?.totalRemainingUsd ?? account?.creditBalanceUsd ?? 0;

  const buyCredits = async (amount: number) => {
    if (!idToken) return;
    setCheckoutBusy(true);
    try {
      const url = await startCreditsCheckout(idToken, amount);
      window.location.href = url;
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Account</h1>

      <div className="mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6">
        <div className="flex items-center gap-3">
          <Coins className="w-8 h-8 text-amber-400" />
          <div>
            <p className="text-slate-400 text-sm">Hive credit balance</p>
            <p className="text-3xl font-black text-white">${balance.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-4 leading-relaxed">
          New accounts receive ${account?.welcomeCreditUsd?.toFixed(2) ?? '2.00'} in free credits to try live Grok
          diagnosis. Pack library and tools stay free. Each chat message uses a small credit amount (~$0.01 text,
          ~$0.022 with a photo). Cartesia voice narration adds ~$0.015 per reply when enabled on Pros teams.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[5, 10, 20].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(amt)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-50"
            >
              {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add $${amt} credits`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1018] p-6">
        <p className="text-white font-bold">{user?.displayName || 'Signed in'}</p>
        <p className="text-slate-500 text-sm">{user?.email}</p>
        {account?.hiveUserId && (
          <p className="text-slate-600 text-xs mt-2 font-mono">{account.hiveUserId}</p>
        )}
        <button
          type="button"
          onClick={() => void signOutUser()}
          className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c1018] p-6">
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-sky-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Pros company account</p>
            <p className="text-sm text-slate-400 mt-2">
              Service companies get Pros HQ — dispatch, team roster, shop knowledge base, and unlimited team AI
              with company Grok keys.
            </p>
            <Link to="/pros/app" className="inline-flex items-center gap-2 mt-4 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              Open Pros HQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
