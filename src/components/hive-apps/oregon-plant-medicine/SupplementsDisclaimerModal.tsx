import { useState } from 'react';
import { AlertTriangle, FileText, X } from 'lucide-react';
import {
  SUPPLEMENTS_DISCLAIMER_SECTIONS,
  SUPPLEMENTS_DISCLAIMER_TITLE,
  acceptSupplementsDisclaimer,
} from '../../../lib/oregonPlantMedicine/supplementsDisclaimer';

type Props = {
  onAccepted: () => void;
  onCancel?: () => void;
  reviewOnly?: boolean;
  userId?: string | null;
};

export default function SupplementsDisclaimerModal({
  onAccepted,
  onCancel,
  reviewOnly = false,
  userId,
}: Props) {
  const [agreed, setAgreed] = useState(reviewOnly);

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div
        className="bg-slate-950 border border-teal-500/35 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplements-disclaimer-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 border-b border-teal-500/20 bg-slate-950/95 backdrop-blur">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-teal-500/15 shrink-0">
              <AlertTriangle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">Hold document</p>
              <h2 id="supplements-disclaimer-title" className="text-lg font-bold text-white mt-0.5">
                {SUPPLEMENTS_DISCLAIMER_TITLE}
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
          {SUPPLEMENTS_DISCLAIMER_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h3 className="text-xs font-black uppercase tracking-widest text-teal-300/90">{section.heading}</h3>
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
                  className="mt-1 rounded border-slate-600 accent-teal-500"
                />
                <span className="text-sm text-slate-200">
                  I understand supplements are not drugs and this library is educational only. I will discuss new products
                  with my physician or pharmacist.
                </span>
              </label>

              <button
                type="button"
                disabled={!agreed}
                onClick={() => {
                  acceptSupplementsDisclaimer(userId);
                  onAccepted();
                }}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-bold text-sm"
              >
                I agree — open Supplements
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
