import { useState } from 'react';
import { ExternalLink, HeartPulse, Leaf, Loader2, MapPin, PawPrint, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LIVING_KNOWLEDGE_SHORT_NAME,
  MIN_RECHARGE_USD,
  STATE_CONTRIBUTION_USD,
  HOLISTIC_TAB_LABEL,
  HYPNOSIS_ENERGY_TAB_LABEL,
  ANIMAL_HEALTH_TAB_LABEL,
} from '../../../lib/oregonPlantMedicine/branding';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import { builderUrlForState } from '../../../lib/oregonPlantMedicine/stateContribution';
import { builderUrlForHolisticTopic } from '../../../lib/oregonPlantMedicine/holisticContribution';
import { builderUrlForHypnosisEnergyTopic } from '../../../lib/oregonPlantMedicine/hypnosisEnergyContribution';
import { builderUrlForAnimalHealthTopic } from '../../../lib/oregonPlantMedicine/animalHealthContribution';

type Props = {
  onClose: () => void;
  stateName?: string;
  city?: string;
  /** Unanswered Ask-agent query — seeds Builder so the library grows */
  seedQuery?: string;
};

export default function ContributeModal({ onClose, stateName, city, seedQuery }: Props) {
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

  const seed = seedQuery?.trim();
  const builderHref = stateName
    ? builderUrlForState(stateName, city)
    : '/hive-apps/build?q=' +
      encodeURIComponent(
        seed
          ? `Add Living Knowledge research answering: "${seed}". Follow plant/topic models in src/lib/oregonPlantMedicine/. Educational tone, safety warnings, cross-links. Contributor is expanding the shared archive so this answer becomes part of the library for everyone.`
          : 'Add new plants to Living Knowledge Plants and Medicine — same fields as the Oregon library (habitat, ID photos, look-alikes, edible/medicinal notes).',
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
            Browse and ask the holistic AI agent for free (offline library RAG). When something is missing, your
            contribution expands Living Knowledge for everyone. Adding a new state to the map costs Hive credits.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-sm text-slate-300 leading-relaxed">
          {seed ? (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Spreading living knowledge</p>
              <p className="mt-1.5 text-amber-50/90 leading-relaxed">
                Your unanswered question becomes a community seed:{' '}
                <strong className="text-white">&ldquo;{seed}&rdquo;</strong>. Publishing it adds the answer to the
                library so the next person finds it instantly.
              </p>
            </div>
          ) : null}

          <div className="flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <Leaf className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Add plants &amp; mushrooms (Builder)</p>
              <p className="mt-1 text-slate-300">
                Publish species with three ID photos, habitat, look-alikes, and preparation notes. Uses AiBhive Builder
                credits — the same depth as our Oregon seed library.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
            <MapPin className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-200">Add your state for ${STATE_CONTRIBUTION_USD}</p>
              <p className="mt-1 text-slate-300">
                New states (e.g. Washington) go live for the whole app. This is the only flat ${STATE_CONTRIBUTION_USD}{' '}
                contribution — search and browsing stay free.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
            <HeartPulse className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-violet-200">Holistic research — free via Builder</p>
              <p className="mt-1 text-slate-300">
                Publish to <strong className="text-white">{HOLISTIC_TAB_LABEL}</strong> at no flat fee.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
            <Sparkles className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-cyan-200">Hypnosis &amp; energy — free via Builder</p>
              <p className="mt-1 text-slate-300">
                Publish to <strong className="text-white">{HYPNOSIS_ENERGY_TAB_LABEL}</strong> at no flat fee.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
            <PawPrint className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Animal health — free via Builder</p>
              <p className="mt-1 text-slate-300">
                Publish to <strong className="text-white">{ANIMAL_HEALTH_TAB_LABEL}</strong> at no flat fee.
              </p>
            </div>
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(STATE_CONTRIBUTION_USD)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
            >
              {checkoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {stateName ? `Add ${stateName}` : 'Add your state'} — ${STATE_CONTRIBUTION_USD}
            </button>
            <Link
              to={builderHref}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 text-sm"
            >
              Open Builder — plants &amp; mushrooms
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <Link
              to={builderUrlForHolisticTopic()}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 text-violet-200 font-bold px-4 py-3 text-sm hover:bg-violet-500/10"
            >
              Open Builder — holistic topic
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <Link
              to={builderUrlForHypnosisEnergyTopic()}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 text-cyan-200 font-bold px-4 py-3 text-sm hover:bg-cyan-500/10"
            >
              Open Builder — hypnosis &amp; energy
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <Link
              to={builderUrlForAnimalHealthTopic()}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 text-rose-200 font-bold px-4 py-3 text-sm hover:bg-rose-500/10"
            >
              Open Builder — animal health
              <ExternalLink className="w-4 h-4 opacity-90" />
            </Link>
            <button
              type="button"
              disabled={checkoutBusy}
              onClick={() => void buyCredits(MIN_RECHARGE_USD)}
              className="w-full text-slate-400 hover:text-white text-xs py-2"
            >
              Recharge Builder credits from ${MIN_RECHARGE_USD}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
