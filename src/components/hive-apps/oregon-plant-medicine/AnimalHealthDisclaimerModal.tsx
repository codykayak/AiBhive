import { useState } from 'react';
import { AlertTriangle, FileText, X } from 'lucide-react';
import {
  ANIMAL_HEALTH_DISCLAIMER_SECTIONS,
  ANIMAL_HEALTH_DISCLAIMER_TITLE,
  acceptAnimalHealthDisclaimer,
} from '../../../lib/oregonPlantMedicine/animalHealthDisclaimer';

type Props = {
  onAccepted: () => void;
  onCancel?: () => void;
  reviewOnly?: boolean;
  userId?: string | null;
};

export default function AnimalHealthDisclaimerModal({
  onAccepted,
  onCancel,
  reviewOnly = false,
  userId,
}: Props) {
  const [agreed, setAgreed] = useState(reviewOnly);

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div
        className="bg-slate-950 border border-rose-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-health-disclaimer-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 border-b border-rose-500/20 bg-slate-950/95 backdrop-blur">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Hold document</p>
              <h2 id="animal-health-disclaimer-title" className="text-lg font-bold text-white mt-0.5">
                {ANIMAL_HEALTH_DISCLAIMER_TITLE}
              </h2>
            </div>
          </div>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 text-slate-400" aria-label="Go back">
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        <div className="p-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          {ANIMAL_HEALTH_DISCLAIMER_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-300/90">{section.heading}</h3>
              <p className="mt-1.5">{section.body}</p>
            </section>
          ))}

          {reviewOnly ? (
            <button
              type="button"
              onClick={onAccepted}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
            >
              Close
            </button>
          ) : (
            <>
              <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-slate-600 accent-rose-500"
                />
                <span className="text-sm text-slate-200">
                  I understand this is educational research only. I will not use it as veterinary advice or delay
                  emergency care for my animals.
                </span>
              </label>

              <button
                type="button"
                disabled={!agreed}
                onClick={() => {
                  acceptAnimalHealthDisclaimer(userId);
                  onAccepted();
                }}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-black font-bold text-sm"
              >
                I agree — open Animal Health
              </button>

              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 justify-center">
                <FileText className="w-3 h-3" />
                You only need to accept once per account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
