import { Link } from 'react-router-dom';
import { Building2, Coins, LogOut, Sparkles } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { cn } from '../../lib/utils';

export default function CreditsDepletedModal() {
  const { creditsDepletedOpen, setCreditsDepletedOpen, account } = useDiagnoseWeb();

  if (!creditsDepletedOpen) return null;

  const balance = account?.totalRemainingUsd ?? account?.creditBalanceUsd ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#0c1018] shadow-2xl p-6 md:p-8"
        role="dialog"
        aria-labelledby="credits-depleted-title"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 id="credits-depleted-title" className="text-xl font-bold text-white">
              Hive credits needed
            </h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Your free trial credits are used up (balance ≈ ${balance.toFixed(2)}). Live Grok diagnosis
              requires Hive credits. The offline pack library still works for free.
            </p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Link
            to="/diagnose/app/account"
            onClick={() => setCreditsDepletedOpen(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Buy Hive credits
          </Link>
          <Link
            to="/pros"
            onClick={() => setCreditsDepletedOpen(false)}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15',
              'text-white font-bold text-sm hover:bg-white/5 transition-colors'
            )}
          >
            <Building2 className="w-4 h-4" />
            Pros company account
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCreditsDepletedOpen(false)}
          className="mt-4 w-full text-center text-slate-500 text-sm hover:text-slate-300"
        >
          Continue with pack library only
        </button>
      </div>
    </div>
  );
}
