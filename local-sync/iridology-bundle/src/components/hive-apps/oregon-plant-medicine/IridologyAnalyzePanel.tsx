import type { User } from 'firebase/auth';
import { useRef, useState } from 'react';
import { AlertTriangle, Camera, ChevronDown, ChevronUp, Eye, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import {
  IRIDOLOGY_METHODOLOGY_LABELS,
  type IridologyMethodology,
} from '../../../lib/oregonPlantMedicine/iridologyTypes';
import {
  IRIDOLOGY_PHOTO_DONTS,
  IRIDOLOGY_PHOTO_DOS,
  IRIDOLOGY_PHOTO_STEPS,
} from '../../../lib/oregonPlantMedicine/iridologyPhotoGuide';
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
import { buildLocalAnalysisRecord } from '../../../lib/oregonPlantMedicine/iridologyHistoryApi';
import {
  saveLocalIridologyAnalysis,
  type IridologySavedAnalysis,
} from '../../../lib/oregonPlantMedicine/iridologyHistoryStorage';
import IridologyCameraModal from './IridologyCameraModal';
import IridologyFollowUpChat from './IridologyFollowUpChat';
import IridologyHistoryPanel from './IridologyHistoryPanel';
import IridologyResults from './IridologyResults';

function buildFollowUpContext(record: IridologySavedAnalysis): string {
  const s = record.structured;
  return [
    '--- SAVED IRIS ANALYSIS (follow-up context) ---',
    `Eye: ${s.eye}`,
    `Photo quality: ${s.photoQuality}`,
    s.integratedSummary ? `Summary: ${s.integratedSummary}` : '',
    s.constitutionalType ? `Constitutional: ${s.constitutionalType.label} — ${s.constitutionalType.rationale}` : '',
    record.reply.slice(0, 5000),
  ]
    .filter(Boolean)
    .join('\n');
}

type Props = {
  user: User | null;
  onSignIn: () => void;
};

type EyeMode = 'left' | 'right' | 'both';

export default function IridologyAnalyzePanel({ user, onSignIn }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickSlot, setPickSlot] = useState<'left' | 'right'>('left');
  const [cameraSlot, setCameraSlot] = useState<'left' | 'right' | null>(null);
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
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [savedAnalysis, setSavedAnalysis] = useState<IridologySavedAnalysis | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [chargedUsd, setChargedUsd] = useState<number | undefined>();
  const [creditBalanceUsd, setCreditBalanceUsd] = useState<number | undefined>();
  const [guideOpen, setGuideOpen] = useState(true);

  const maxPhotos = eyeMode === 'both' ? 2 : 1;

  const assignPhoto = (slot: 'left' | 'right', photo: PlantPhotoAttachment) => {
    if (slot === 'left') setLeftPhoto(photo);
    else setRightPhoto(photo);
    setError('');
    setCreditsNeeded(false);
  };

  const onPickFiles = async (fileList: FileList | null, slot: 'left' | 'right') => {
    if (!fileList?.length) return;
    try {
      const batch = await filesToVisionAttachments(Array.from(fileList).slice(0, 1));
      if (!batch.length) {
        setError('Please choose an image file (JPEG, PNG, or HEIC).');
        return;
      }
      assignPhoto(slot, batch[0]);
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
    }

    if (!attachments.length) {
      setError('Take or upload at least one clear iris photo using the camera above.');
      return;
    }

    if (eyeMode === 'both' && attachments.length < 2) {
      setError('Both mode needs a left and right eye photo — capture each eye separately.');
      return;
    }

    const eye: IridologyEyeHint =
      eyeMode === 'both' ? 'both' : eyeMode === 'left' ? 'left' : eyeMode === 'right' ? 'right' : 'unknown';

    setBusy(true);
    setError('');
    setCreditsNeeded(false);
    setReply('');
    setStructured(null);
    setAnalysisId(null);
    setSavedAnalysis(null);

    const previewUrls = attachments.map((a) => a.previewUrl).filter((u): u is string => !!u);

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

      const id = result.analysisId || `local_${Date.now()}`;
      const record = buildLocalAnalysisRecord({
        id,
        methodology,
        eye,
        notes: notes.trim(),
        reply: result.reply,
        structured: result.structured,
        photoPreviewUrls: previewUrls,
      });
      saveLocalIridologyAnalysis(user.uid, record);
      setAnalysisId(id);
      setSavedAnalysis(record);
      setHistoryRefresh((v) => v + 1);
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

  const openCamera = (slot: 'left' | 'right') => {
    setCameraSlot(slot);
  };

  const loadSavedAnalysis = (record: IridologySavedAnalysis) => {
    setReply(record.reply);
    setStructured(record.structured);
    setAnalysisId(record.id);
    setSavedAnalysis(record);
    setMethodology(
      (record.structured.methodology as IridologyMethodology) || (record.methodology as IridologyMethodology) || 'integrated',
    );
    if (record.eye === 'both') setEyeMode('both');
    else if (record.eye === 'right') setEyeMode('right');
    else setEyeMode('left');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-indigo-500/10"
        >
          <span className="text-sm font-bold text-indigo-100 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-300" />
            How to take a clear iris photo
          </span>
          {guideOpen ? <ChevronUp className="w-4 h-4 text-indigo-300" /> : <ChevronDown className="w-4 h-4 text-indigo-300" />}
        </button>
        {guideOpen ? (
          <div className="px-4 pb-4 space-y-3 border-t border-indigo-500/15">
            <ol className="mt-3 space-y-2">
              {IRIDOLOGY_PHOTO_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-200 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="text-white">{step.title}.</strong> {step.detail}
                  </span>
                </li>
              ))}
            </ol>
            <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <p className="font-bold text-emerald-300 mb-1">Do</p>
                <ul className="text-emerald-100/90 space-y-0.5">
                  {IRIDOLOGY_PHOTO_DOS.map((t) => (
                    <li key={t}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5">
                <p className="font-bold text-rose-300 mb-1">Avoid</p>
                <ul className="text-rose-100/85 space-y-0.5">
                  {IRIDOLOGY_PHOTO_DONTS.map((t) => (
                    <li key={t}>✗ {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <IridologyHistoryPanel
        user={user}
        activeId={analysisId}
        refreshKey={historyRefresh}
        onSelect={loadSavedAnalysis}
      />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100/90 mb-4 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          Tap <strong className="text-amber-100">Take iris photo</strong> to open the live camera with an on-screen iris
          guide. Blurry or partial photos produce limited reports — retake if quality is poor.
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
            onTakePhoto={() => openCamera('left')}
            onGallery={() => {
              setPickSlot('left');
              fileRef.current?.click();
            }}
          />
        )}
        {(eyeMode === 'right' || eyeMode === 'both') && (
          <PhotoSlot
            label={eyeMode === 'both' ? 'Right eye' : 'Iris photo'}
            photo={rightPhoto}
            onClear={() => setRightPhoto(null)}
            onTakePhoto={() => openCamera('right')}
            onGallery={() => {
              setPickSlot('right');
              fileRef.current?.click();
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
          void onPickFiles(e.target.files, pickSlot);
          e.target.value = '';
        }}
      />

      <label className="block text-xs font-semibold text-slate-300 mb-4">
        Optional notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. window light, no contacts, which eye feels easier to photograph"
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
        {busy ? 'Analyzing iris…' : 'Analyze iris'}
      </button>

      {structured && reply ? (
        <div className="mt-6 pt-6 border-t border-indigo-500/20 space-y-4">
          <IridologyResults
            reply={reply}
            structured={structured}
            chargedUsd={chargedUsd}
            creditBalanceUsd={creditBalanceUsd}
            onAddCredits={() => void addCredits()}
          />
          {analysisId ? (
            <IridologyFollowUpChat
              key={analysisId}
              analysisId={analysisId}
              user={user}
              onSignIn={onSignIn}
              initialMessages={savedAnalysis?.chatMessages}
              localContext={savedAnalysis ? buildFollowUpContext(savedAnalysis) : undefined}
            />
          ) : null}
        </div>
      ) : null}

      <p className="text-[10px] text-slate-500 mt-4">
        Up to {maxPhotos} photo{maxPhotos > 1 ? 's' : ''} per request. Uses Bhive Credits unless admin-exempt.
      </p>

      {cameraSlot ? (
        <IridologyCameraModal
          eye={cameraSlot}
          onCapture={(photo) => assignPhoto(cameraSlot, photo)}
          onClose={() => setCameraSlot(null)}
        />
      ) : null}
    </section>
  );
}

function PhotoSlot({
  label,
  photo,
  onClear,
  onTakePhoto,
  onGallery,
}: {
  label: string;
  photo: PlantPhotoAttachment | null;
  onClear: () => void;
  onTakePhoto: () => void;
  onGallery: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-3">
      <p className="text-xs font-bold text-slate-300 mb-2">{label}</p>
      {photo?.previewUrl ? (
        <div className="relative mb-2">
          <img
            src={photo.previewUrl}
            alt={`${label} preview`}
            className="w-full h-40 object-cover rounded-lg border border-slate-700"
          />
          <div className="absolute bottom-2 left-2 flex gap-2">
            <button
              type="button"
              onClick={onTakePhoto}
              className="text-[10px] font-bold bg-indigo-600/90 px-2 py-1 rounded text-white"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] font-bold bg-black/70 px-2 py-1 rounded text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onTakePhoto}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-indigo-500/40 bg-indigo-600/20 text-indigo-100 text-sm font-bold hover:bg-indigo-600/30"
          >
            <Camera className="w-5 h-5" /> Take iris photo
          </button>
          <button
            type="button"
            onClick={onGallery}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-800"
          >
            <ImagePlus className="w-4 h-4" /> Choose from gallery
          </button>
        </div>
      )}
    </div>
  );
}
