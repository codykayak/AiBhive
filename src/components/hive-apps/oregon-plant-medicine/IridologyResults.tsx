import { AlertTriangle } from 'lucide-react';
import type { IridologyStructuredResult } from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { IRIDOLOGY_METHODOLOGY_LABELS } from '../../../lib/oregonPlantMedicine/iridologyTypes';
import type { IridologyMethodology } from '../../../lib/oregonPlantMedicine/iridologyTypes';

type Props = {
  reply: string;
  structured: IridologyStructuredResult;
  chargedUsd?: number;
  creditBalanceUsd?: number;
  onAddCredits?: () => void;
};

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-100 border-amber-500/30',
  low: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
};

const QUALITY_STYLES = {
  good: 'text-emerald-300',
  fair: 'text-amber-300',
  poor: 'text-rose-300',
};

export default function IridologyResults({ reply, structured, chargedUsd, creditBalanceUsd, onAddCredits }: Props) {
  const methodologyLabel =
    IRIDOLOGY_METHODOLOGY_LABELS[structured.methodology as IridologyMethodology] || structured.methodology;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-rose-100/90 leading-relaxed">
          <strong className="text-rose-200">Not medical diagnosis.</strong> Educational iridology interpretation only.
          Iridology is not validated clinical science. Seek licensed care for symptoms and emergencies.
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/25 bg-slate-900/50 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
          <span className={`px-2 py-1 rounded-full border ${QUALITY_STYLES[structured.photoQuality]}`}>
            Photo: {structured.photoQuality}
          </span>
          <span className="px-2 py-1 rounded-full border border-indigo-500/30 text-indigo-200 bg-indigo-500/10">
            {methodologyLabel}
          </span>
          {structured.eye !== 'unknown' ? (
            <span className="px-2 py-1 rounded-full border border-slate-600 text-slate-300">Eye: {structured.eye}</span>
          ) : null}
        </div>

        {structured.retakeAdvice ? (
          <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
            Retake advice: {structured.retakeAdvice}
          </p>
        ) : null}

        {structured.constitutionalType ? (
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Constitutional type</p>
            <p className="text-white font-semibold capitalize">{structured.constitutionalType.label}</p>
            <span
              className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${CONFIDENCE_STYLES[structured.constitutionalType.confidence]}`}
            >
              {structured.constitutionalType.confidence} confidence
            </span>
            <p className="text-sm text-slate-300 mt-2">{structured.constitutionalType.rationale}</p>
          </div>
        ) : null}

        {reply ? (
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap">{reply}</div>
        ) : null}
      </div>

      {structured.observations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Observations</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {structured.observations.map((obs, i) => (
              <div key={`${obs.zone}-${obs.sign}-${i}`} className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{obs.sign}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${CONFIDENCE_STYLES[obs.confidence]}`}
                  >
                    {obs.confidence}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 mb-1">{obs.zone}</p>
                <p className="text-sm text-slate-300">{obs.meaning}</p>
                {obs.sources.length > 0 ? (
                  <p className="text-[10px] text-slate-500 mt-2">Sources: {obs.sources.join(', ')}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {structured.wellnessTendencies.length > 0 ? (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Wellness tendencies (literature)</p>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {structured.wellnessTendencies.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {structured.cautions.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-2">Cautions</p>
          <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1">
            {structured.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {(chargedUsd != null || creditBalanceUsd != null) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
          <span>
            {chargedUsd != null ? `Hive Research used ~$${chargedUsd.toFixed(2)}` : null}
            {creditBalanceUsd != null ? ` · Balance ~$${creditBalanceUsd.toFixed(2)}` : null}
          </span>
          {onAddCredits ? (
            <button type="button" onClick={onAddCredits} className="text-indigo-300 hover:underline font-semibold">
              Add Bhive Credits
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
