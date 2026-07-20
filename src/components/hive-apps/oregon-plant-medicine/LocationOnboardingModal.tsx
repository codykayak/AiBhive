import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Sparkles, X } from 'lucide-react';
import {
  LIVING_KNOWLEDGE_APP_NAME,
  LIVING_KNOWLEDGE_SHORT_NAME,
  MIN_RECHARGE_USD,
  STATE_CONTRIBUTION_USD,
} from '../../../lib/oregonPlantMedicine/branding';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import {
  isSupportedLocation,
  locationLabel,
  oregonRegionLabel,
  parseUserLocation,
  type UserLocation,
} from '../../../lib/oregonPlantMedicine/regions';
import { builderUrlForState } from '../../../lib/oregonPlantMedicine/stateContribution';

type Props = {
  initial?: UserLocation | null;
  initialStep?: Step;
  onComplete: (loc: UserLocation) => void;
  onClose?: () => void;
  requireSubmit?: boolean;
};

type Step = 'location' | 'welcome' | 'add-state';

export default function LocationOnboardingModal({
  initial,
  initialStep,
  onComplete,
  onClose,
  requireSubmit = true,
}: Props) {
  const [city, setCity] = useState(initial?.city ?? '');
  const [stateInput, setStateInput] = useState(initial?.state ?? '');
  const [step, setStep] = useState<Step>(initialStep ?? 'location');
  const [parsed, setParsed] = useState<UserLocation | null>(initial ?? null);
  const [error, setError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('credits') === 'added') {
      const url = new URL(window.location.href);
      url.searchParams.delete('credits');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!stateInput.trim()) {
      setError('Please enter your state (e.g. Oregon or WA).');
      return;
    }
    const loc = parseUserLocation(city, stateInput);
    if (!loc.state) {
      setError('Please enter a valid state name or abbreviation.');
      return;
    }
    setParsed(loc);
    if (isSupportedLocation(loc)) {
      setStep('welcome');
    } else {
      setStep('add-state');
    }
  };

  const finish = (loc: UserLocation) => {
    onComplete(loc);
  };

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

  const addStateUrl = parsed ? builderUrlForState(parsed.state, parsed.city) : '/hive-apps/build';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="bg-slate-950 border border-emerald-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative p-5 sm:p-6 border-b border-emerald-500/15">
          {onClose && step === 'location' ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
            {LIVING_KNOWLEDGE_SHORT_NAME}
          </p>
          <h2 id="location-modal-title" className="text-xl sm:text-2xl font-black text-white mt-2 pr-8">
            {step === 'location' && 'Where are you foraging?'}
            {step === 'welcome' && 'Plants near you'}
            {step === 'add-state' && 'Open your state'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {step === 'location' &&
              'Enter your city or town and state so we can show localized plants from the living knowledge base.'}
            {step === 'welcome' && parsed
              ? `Showing wild plants documented for ${oregonRegionLabel(parsed.oregonRegion)}.`
              : null}
            {step === 'add-state' && parsed
              ? `${parsed.state} is not in the library yet. Help everyone by adding your state to the living knowledge base.`
              : null}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {step === 'location' ? (
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label htmlFor="lk-city" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  City / town <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="lk-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Eugene, Florence, Seattle…"
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label htmlFor="lk-state" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  State <span className="text-red-400">*</span>
                </label>
                <input
                  id="lk-state"
                  type="text"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  placeholder="Oregon, WA, California…"
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                  autoComplete="address-level1"
                  required
                />
              </div>
              {error ? <p className="text-xs text-red-300">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm transition-colors"
              >
                Show localized plants
              </button>
              {!requireSubmit && onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 py-1"
                >
                  Skip for now
                </button>
              ) : null}
            </form>
          ) : null}

          {step === 'welcome' && parsed ? (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <MapPin className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-100/90">
                  <p className="font-bold text-emerald-200">{locationLabel(parsed)}</p>
                  <p className="mt-1">
                    {parsed.oregonRegion === 'all'
                      ? 'Browsing all Oregon regions in the living knowledge base.'
                      : `Focused on ${oregonRegionLabel(parsed.oregonRegion)}.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => finish(parsed)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm"
              >
                Explore {LIVING_KNOWLEDGE_APP_NAME}
              </button>
            </div>
          ) : null}

          {step === 'add-state' && parsed ? (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                <p className="font-bold text-sky-200">Add your state for ${STATE_CONTRIBUTION_USD}</p>
                <p className="mt-2 leading-relaxed">
                  When you add <strong className="text-white">{parsed.state}</strong>, your plants and photos are
                  published to the full {LIVING_KNOWLEDGE_APP_NAME} app for everybody. Use the AiBhive Builder with{' '}
                  <strong className="text-white">${STATE_CONTRIBUTION_USD} in Hive credits</strong> — enough to seed your
                  state library with the same depth as our Oregon database.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <p className="leading-relaxed">
                  Builder prompts walk you through habitat, ID photos, look-alikes, edible and medicinal notes — the same
                  fields we used to build this library. Add as many plants as you like after your state is live.
                </p>
              </div>

              {error ? <p className="text-xs text-red-300">{error}</p> : null}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={checkoutBusy}
                  onClick={() => void buyCredits(STATE_CONTRIBUTION_USD)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 text-sm"
                >
                  {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Add {parsed.state} — ${STATE_CONTRIBUTION_USD} credits
                </button>
                <Link
                  to={addStateUrl}
                  onClick={() => finish(parsed)}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-emerald-500/40 text-emerald-200 font-bold py-3 text-sm hover:bg-emerald-500/10"
                >
                  Open Builder with state prompt
                </Link>
                <button
                  type="button"
                  disabled={checkoutBusy}
                  onClick={() => void buyCredits(MIN_RECHARGE_USD)}
                  className="w-full text-slate-400 hover:text-white text-xs py-2"
                >
                  Recharge from ${MIN_RECHARGE_USD}
                </button>
                <button
                  type="button"
                  onClick={() => finish(parsed)}
                  className="w-full text-slate-500 hover:text-slate-300 text-xs py-1"
                >
                  Browse Oregon library for now
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
