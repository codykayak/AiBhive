import type { User } from 'firebase/auth';
import { useRef, useState } from 'react';
import { AlertTriangle, Camera, Eye, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import {
  IRIDOLOGY_METHODOLOGY_LABELS,
  type IridologyMethodology,
} from '../../../lib/oregonPlantMedicine/iridologyTypes';
import {
  PlantCreditsError,
  filesToVisionAttachments,
  sendIridologyAnalyze,
  type IridologyEyeHint,
  type IridologyStructuredResult,
  type PlantPhotoAttachment,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import { HIVE_RESEARCH_LABEL, HIVE_RESEARCH_POWERED_BY } from '../../../lib/oregonPlantMedicine/branding';
import IridologyResults from './IridologyResults';

type Props = {
  user: User | null;
  onSignIn: () => void;
};

type EyeMode = 'left' | 'right' | 'both';

export default function IridologyAnalyzePanel({ user, onSignIn }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [pickSlot, setPickSlot] = useState<'left' | 'right' | 'auto'>('auto');
  const [methodology, setMethodology] = useState<IridologyMethodology>('integrated');
  const [eyeMode, setEyeMode] = useState<EyeMode>('left');
  const [notes, setNotes] = useState('');
  const [leftPhoto, setLeftPhoto] = useState<PlantPhotoAttachment | null>(null);
  const [rightPhoto, setRightPhoto] = useState<PlantPhotoAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [creditsNeeded, setCreditsNeeded] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [reply, setReply] = useState('');
  const [structured, setStructured] = useState<IridologyStructuredResult | null>(null);
  const [chargedUsd, setChargedUsd] = useState<number | undefined>();
  const [creditBalanceUsd, setCreditBalanceUsd] = useState<number | undefined>();

  const maxPhotos = eyeMode === 'both' ? 2 : 1;

  const onPickFiles = async (fileList: FileList | null, slot: 'left' | 'right' | 'auto') => {
    if (!fileList?.length) return;
    try {
      const batch = await filesToVisionAttachments(Array.from(fileList).slice(0, 1));
      if (!batch.length) {
        setError('Please choose an image file (JPEG, PNG, or HEIC).');
        return;
      }
      const photo = batch[0];
      if (slot === 'left' || (slot === 'auto' && eyeMode !== 'right')) {
        setLeftPhoto(photo);
      } else {
        setRightPhoto(photo);
      }
      setError('');
      setCreditsNeeded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read photo');
    }
  };

  const addCredits = async () => {
    setCheckoutBusy(true);
    try {
      const url = await startLivingKnowledgeCreditsCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const analyze = async () => {
    if (!user) {
      onSignIn();
      setError('Sign in to use paid iris photo analysis (Bhive Credits).');
      return;
    }

    const attachments: PlantPhotoAttachment[] = [];
    if (eyeMode === 'both') {
      if (leftPhoto) attachments.push(leftPhoto);
      if (rightPhoto) attachments.push(rightPhoto);
    } else if (eyeMode === 'left' && leftPhoto) {
      attachments.push(leftPhoto);
    } else if (eyeMode === 'right' && rightPhoto) {
      attachments.push(rightPhoto);
    } else if (leftPhoto) {
      attachments.push(leftPhoto);
    } else if (rightPhoto) {
      attachments.push(rightPhoto);
    }

    if (!attachments.length) {
      setError('Add at least one iris photo.');
      return;
    }

    const eye: IridologyEyeHint =
      eyeMode === 'both' ? 'both' : eyeMode === 'left' ? 'left' : eyeMode === 'right' ? 'right' : 'unknown';

    setBusy(true);
    setError('');
    setCreditsNeeded(false);
    setReply('');
    setStructured(null);

    try {
      const result = await sendIridologyAnalyze(user, {
        methodology,
        eye,
        notes: notes.trim(),
        attachment: attachments.length === 1 ? attachments[0] : undefined,
        attachments: attachments.length > 1 ? attachments : undefined,
      });
      setReply(result.reply);
      setStructured(result.structured);
      setChargedUsd(result.chargedUsd);
      setCreditBalanceUsd(result.creditBalanceUsd);
    } catch (err) {
      if (err instanceof PlantCreditsError) {
        setCreditsNeeded(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-950/80 to-slate-950 p-4 sm:p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
          <Eye className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Hive Research vision</p>
          <h2 className="text-lg sm:text-xl font-bold text-white">AI iris photo analysis</h2>
          <p className="text-sm text-slate-400 mt-1">
            {HIVE_RESEARCH_LABEL} · {HIVE_RESEARCH_POWERED_BY}. Educational iridology only — not diagnosis.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100/90 mb-4 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          Use natural light, no flash, fill the frame with the iris. Remove contact lenses if possible. Capture left and
          right eyes separately when comparing zones.
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="block text-xs font-semibold text-slate-300">
          Methodology
          <select
            value={methodology}
            onChange={(e) => setMethodology(e.target.value as IridologyMethodology)}
            className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500/50"
          >
            {(Object.keys(IRIDOLOGY_METHODOLOGY_LABELS) as IridologyMethodology[]).map((key) => (
              <option key={key} value={key}>
                {IRIDOLOGY_METHODOLOGY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="text-xs font-semibold text-slate-300">
          <legend className="mb-1">Eye</legend>
          <div className="flex flex-wrap gap-2">
            {(['left', 'right', 'both'] as EyeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setEyeMode(mode)}
                className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                  eyeMode === mode
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-100'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`grid gap-3 mb-4 ${eyeMode === 'both' ? 'sm:grid-cols-2' : ''}`}>
        {(eyeMode === 'left' || eyeMode === 'both') && (
          <PhotoSlot
            label={eyeMode === 'both' ? 'Left eye' : 'Iris photo'}
            photo={leftPhoto}
            onClear={() => setLeftPhoto(null)}
            onGallery={() => {
              setPickSlot('left');
              fileRef.current?.click();
            }}
            onCamera={() => {
              setPickSlot('left');
              cameraRef.current?.click();
            }}
          />
        )}
        {(eyeMode === 'right' || eyeMode === 'both') && (
          <PhotoSlot
            label={eyeMode === 'both' ? 'Right eye' : 'Iris photo'}
            photo={rightPhoto}
            onClear={() => setRightPhoto(null)}
            onGallery={() => {
              setPickSlot('right');
              fileRef.current?.click();
            }}
            onCamera={() => {
              setPickSlot('right');
              cameraRef.current?.click();
            }}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const slot =
            pickSlot === 'auto'
              ? eyeMode === 'right'
                ? 'right'
                : eyeMode === 'both' && !leftPhoto
                  ? 'left'
                  : eyeMode === 'both' && leftPhoto && !rightPhoto
                    ? 'right'
                    : 'auto'
              : pickSlot;
          void onPickFiles(e.target.files, slot);
          e.target.value = '';
          setPickSlot('auto');
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const slot =
            pickSlot === 'auto'
              ? eyeMode === 'right'
                ? 'right'
                : eyeMode === 'both' && !leftPhoto
                  ? 'left'
                  : eyeMode === 'both' && leftPhoto && !rightPhoto
                    ? 'right'
                    : 'auto'
              : pickSlot;
          void onPickFiles(e.target.files, slot);
          e.target.value = '';
          setPickSlot('auto');
        }}
      />

      <label className="block text-xs font-semibold text-slate-300 mb-4">
        Optional notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. natural window light, no contacts"
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500/50 resize-none"
        />
      </label>

      {error ? <p className="text-sm text-rose-300 mb-3">{error}</p> : null}

      {creditsNeeded ? (
        <button
          type="button"
          disabled={checkoutBusy}
          onClick={() => void addCredits()}
          className="mb-3 text-sm font-bold text-indigo-300 hover:underline disabled:opacity-50"
        >
          Add Bhive Credits to continue →
        </button>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void analyze()}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Analyze iris
      </button>

      {structured && reply ? (
        <div className="mt-6 pt-6 border-t border-indigo-500/20">
          <IridologyResults
            reply={reply}
            structured={structured}
            chargedUsd={chargedUsd}
            creditBalanceUsd={creditBalanceUsd}
            onAddCredits={() => void addCredits()}
          />
        </div>
      ) : null}

      <p className="text-[10px] text-slate-500 mt-4">
        Up to {maxPhotos} photo{maxPhotos > 1 ? 's' : ''} per request. Uses Bhive Credits unless admin-exempt.
      </p>
    </section>
  );
}

function PhotoSlot({
  label,
  photo,
  onClear,
  onGallery,
  onCamera,
}: {
  label: string;
  photo: PlantPhotoAttachment | null;
  onClear: () => void;
  onGallery: () => void;
  onCamera: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-3">
      <p className="text-xs font-bold text-slate-300 mb-2">{label}</p>
      {photo?.previewUrl ? (
        <div className="relative mb-2">
          <img src={photo.previewUrl} alt="" className="w-full h-36 object-cover rounded-lg border border-slate-700" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 text-[10px] font-bold bg-black/70 px-2 py-1 rounded text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCamera}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-indigo-500/30 text-indigo-200 text-xs font-bold hover:bg-indigo-500/10"
          >
            <Camera className="w-4 h-4" /> Camera
          </button>
          <button
            type="button"
            onClick={onGallery}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-800"
          >
            <ImagePlus className="w-4 h-4" /> Gallery
          </button>
        </div>
      )}
    </div>
  );
}
