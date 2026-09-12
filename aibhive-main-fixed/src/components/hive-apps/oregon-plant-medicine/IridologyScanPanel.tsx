import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  History,
  ImagePlus,
  Loader2,
  MessageSquare,
  RefreshCw,
  ScanEye,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  HIVE_RESEARCH_LABEL,
  HIVE_RESEARCH_POWERED_BY,
} from '../../../lib/oregonPlantMedicine/branding';
import { compressPlantImageFile } from '../../../lib/oregonPlantMedicine/compressPlantImage';
import {
  IRIDOLOGY_METHODOLOGY_LABELS,
  IRIDOLOGY_PHOTO_AVOIDS,
  IRIDOLOGY_PHOTO_DOS,
  IRIDOLOGY_PHOTO_QUALITY_LABELS,
  IRIDOLOGY_PHOTO_TIPS,
  eyeCapturePrompt,
  followUpContextFromAnalysis,
  loadIridologyHistory,
  makeIridologyHistoryRecord,
  mergeIridologyHistory,
  saveIridologyHistoryItem,
  updateIridologyHistoryChat,
  type IridologyEye,
  type IridologyHistorySummary,
  type IridologyMethodology,
  type IridologySavedAnalysis,
  type IridologyStructuredReport,
} from '../../../lib/oregonPlantMedicine/iridologyAnalysis';
import { startLivingKnowledgeCreditsCheckout } from '../../../lib/oregonPlantMedicine/plantMedicineCredits';
import {
  PlantCreditsError,
  fetchIridologyAnalysis,
  fetchIridologyHistory,
  filesToVisionAttachments,
  sendIridologyAnalyze,
  sendIridologyFollowupChat,
  sendLivingKnowledgeChat,
  type PlantPhotoAttachment,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';

const CONFIDENCE_BADGE: Record<string, string> = {
  high: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-100 border-amber-500/30',
  low: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
};

const PHOTO_QUALITY_BADGE: Record<string, string> = {
  good: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  fair: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  poor: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
};

function newMsgId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ReportSection({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: typeof Eye;
}) {
  if (!body.trim()) return null;
  return (
    <section className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{body}</p>
    </section>
  );
}

function renderNarrative(reply: string): ReactNode {
  return reply.split('\n').map((line, i) =>
    line.startsWith('## ') ? (
      <h3 key={i} className="text-sm font-bold text-indigo-200 mt-4 mb-2 first:mt-0">
        {line.replace(/^##\s+/, '')}
      </h3>
    ) : line.trim() ? (
      <p key={i} className="text-sm text-slate-200 leading-relaxed mb-2">
        {line}
      </p>
    ) : (
      <br key={i} />
    ),
  );
}

function IrisReport({
  reply,
  structured,
  chargedUsd,
  creditBalanceUsd,
  onAddCredits,
}: {
  reply: string;
  structured: IridologyStructuredReport;
  chargedUsd?: number;
  creditBalanceUsd?: number;
  onAddCredits?: () => void;
}) {
  const methodLabel =
    IRIDOLOGY_METHODOLOGY_LABELS[structured.methodology as IridologyMethodology] ||
    structured.methodology;
  const hasBlocks =
    structured.photoAssessment ||
    structured.globalOverview ||
    structured.fiberAndTexture ||
    structured.integratedSummary ||
    (structured.nextSteps && structured.nextSteps.length > 0);
  const quality = String(structured.photoQuality || 'fair');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Your iris analysis report</h2>
      </div>
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-rose-100/90 leading-relaxed">
          <strong className="text-rose-200">Iridology reading.</strong> Constitution, tissue quality,
          and organ-zone emphasis from Jensen and European charts. Eye pain, vision changes, flashes,
          or a curtain over vision need urgent eye care.
        </div>
      </div>
      <div className="rounded-xl border border-indigo-500/25 bg-slate-900/50 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
          <span className={`px-2 py-1 rounded-full border ${PHOTO_QUALITY_BADGE[quality] || PHOTO_QUALITY_BADGE.fair}`}>
            {IRIDOLOGY_PHOTO_QUALITY_LABELS[quality as keyof typeof IRIDOLOGY_PHOTO_QUALITY_LABELS] ||
              quality}
          </span>
          <span className="px-2 py-1 rounded-full border border-indigo-500/30 text-indigo-200 bg-indigo-500/10">
            {methodLabel}
          </span>
          {structured.eye !== 'unknown' ? (
            <span className="px-2 py-1 rounded-full border border-slate-600 text-slate-300">
              Eye: {structured.eye}
            </span>
          ) : null}
        </div>
        {structured.retakeAdvice ? (
          <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
            <strong className="text-amber-100">Retake advice:</strong> {structured.retakeAdvice}
          </p>
        ) : null}
      </div>
      {hasBlocks ? (
        <div className="space-y-3">
          <ReportSection title="Photo assessment" body={structured.photoAssessment || ''} icon={Camera} />
          <ReportSection title="Global iris overview" body={structured.globalOverview || ''} icon={Eye} />
          <ReportSection title="Fiber & texture" body={structured.fiberAndTexture || ''} icon={Eye} />
          <ReportSection title="Integrated summary" body={structured.integratedSummary || ''} icon={Eye} />
          {structured.nextSteps && structured.nextSteps.length > 0 ? (
            <section className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">
                What to do next
              </h3>
              <ul className="list-disc list-inside text-sm text-slate-200 space-y-1.5">
                {structured.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
      {reply ? (
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-3">
            Full narrative report
          </h3>
          <div>{renderNarrative(reply)}</div>
        </div>
      ) : null}
      {structured.constitutionalType ? (
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">
            Constitutional type
          </p>
          <p className="text-white font-semibold capitalize">{structured.constitutionalType.label}</p>
          <span
            className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${CONFIDENCE_BADGE[structured.constitutionalType.confidence]}`}
          >
            {structured.constitutionalType.confidence} confidence
          </span>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {structured.constitutionalType.rationale}
          </p>
        </div>
      ) : null}
      {structured.observations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
            Zone & sign observations
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {structured.observations.map((obs, i) => (
              <div
                key={`${obs.zone}-${obs.sign}-${i}`}
                className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{obs.sign}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${CONFIDENCE_BADGE[obs.confidence]}`}
                  >
                    {obs.confidence}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 mb-1">{obs.zone}</p>
                {obs.clockHour || obs.ring ? (
                  <p className="text-[10px] text-slate-500 mb-1">
                    {[obs.clockHour ? `Clock ${obs.clockHour}` : '', obs.ring ? `Ring: ${obs.ring}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {obs.visibleEvidence ? (
                  <p className="text-[11px] text-slate-400 mb-1 italic">Seen: {obs.visibleEvidence}</p>
                ) : null}
                <p className="text-sm text-slate-300 leading-relaxed">{obs.meaning}</p>
                {obs.sources.length > 0 ? (
                  <p className="text-[10px] text-slate-500 mt-2">Schools: {obs.sources.join(', ')}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {structured.wellnessTendencies.length > 0 ? (
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
            Wellness tendencies (iridology literature)
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1.5">
            {structured.wellnessTendencies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {structured.cautions.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-2">Cautions</p>
          <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1.5">
            {structured.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {chargedUsd != null || creditBalanceUsd != null ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
          <span>
            {chargedUsd != null ? `Hive Research used ~$${chargedUsd.toFixed(2)}` : null}
            {creditBalanceUsd != null ? ` · Balance ~$${creditBalanceUsd.toFixed(2)}` : null}
          </span>
          {onAddCredits ? (
            <button
              type="button"
              onClick={onAddCredits}
              className="text-indigo-300 hover:underline font-semibold"
            >
              Add Bhive Credits
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
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

function IrisCameraOverlay({
  eye,
  onCapture,
  onClose,
}: {
  eye: string;
  onCapture: (photo: PlantPhotoAttachment) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [starting, setStarting] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [showTips, setShowTips] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: 'user' | 'environment') => {
      setStarting(true);
      setError('');
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera not available in this browser — use Gallery instead.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not open camera');
      } finally {
        setStarting(false);
      }
    },
    [stopStream],
  );

  useEffect(() => {
    void startCamera(facing);
    return () => stopStream();
  }, [facing, startCamera, stopStream]);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('Camera not ready — wait a moment and try again.');
      return;
    }
    setCapturing(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not capture frame');
      if (facing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Capture failed'))), 'image/jpeg', 0.92);
      });
      const file = new File([blob], `iris-${eye}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const compressed = await compressPlantImageFile(file, { forVision: true });
      onCapture({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        previewUrl: compressed.previewUrl,
      });
      stopStream();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setCapturing(false);
    }
  };

  const onGalleryFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setCapturing(true);
    setError('');
    try {
      const compressed = await compressPlantImageFile(file, { forVision: true });
      onCapture({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        previewUrl: compressed.previewUrl,
      });
      stopStream();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read photo');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-950/95">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Iris camera</p>
          <h2 className="text-sm font-bold text-white">{eyeCapturePrompt(eye)}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="p-2 rounded-full hover:bg-white/10 text-slate-300"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative flex-1 min-h-0 bg-black">
        {starting ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : null}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[min(72vw,280px)] aspect-square rounded-full border-2 border-indigo-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        <p className="absolute bottom-24 left-0 right-0 text-center text-xs text-white/90 px-6 drop-shadow">
          Center the iris inside the circle · {facing === 'user' ? 'Front camera' : 'Rear camera (mirror mode)'}
        </p>
      </div>
      {showTips ? (
        <div className="max-h-[38vh] overflow-y-auto border-t border-indigo-500/20 bg-slate-950/95 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
              Clear photo checklist
            </p>
            <button
              type="button"
              onClick={() => setShowTips(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Hide
            </button>
          </div>
          <ol className="space-y-2">
            {IRIDOLOGY_PHOTO_TIPS.map((tip, i) => (
              <li key={tip.title} className="flex gap-2 text-xs text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-200 font-bold flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-white">{tip.title}.</strong> {tip.detail}
                </span>
              </li>
            ))}
          </ol>
          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <ul className="text-emerald-200/90 space-y-1">
              {IRIDOLOGY_PHOTO_DOS.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
            <ul className="text-rose-200/80 space-y-1">
              {IRIDOLOGY_PHOTO_AVOIDS.map((item) => (
                <li key={item}>✗ {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowTips(true)}
          className="text-center text-[10px] text-indigo-300 py-2 border-t border-indigo-500/20 bg-slate-950/95"
        >
          Show photo tips
        </button>
      )}
      {error ? <p className="px-4 py-2 text-xs text-rose-300 bg-rose-950/40">{error}</p> : null}
      <div className="flex items-center justify-center gap-4 px-4 py-4 bg-slate-950 border-t border-white/10">
        <button
          type="button"
          onClick={() => setFacing((m) => (m === 'user' ? 'environment' : 'user'))}
          className="p-3 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
          aria-label="Switch camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={capturing || starting}
          onClick={() => void captureFrame()}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25"
        >
          {capturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          Capture iris
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs font-semibold text-slate-400 hover:text-white px-2"
        >
          Gallery
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            void onGalleryFile(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

function FollowupChat({
  analysisId,
  user,
  onSignIn,
  initialMessages = [],
  localContext,
}: {
  analysisId: string;
  user: User | null;
  onSignIn: () => void;
  initialMessages?: IridologySavedAnalysis['chatMessages'];
  localContext?: string;
}) {
  const [messages, setMessages] = useState(() => initialMessages.map((m) => ({ ...m, id: newMsgId() })));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isLocal = analysisId.startsWith('local_');

  useEffect(() => {
    setMessages(initialMessages.map((m) => ({ ...m, id: newMsgId() })));
  }, [analysisId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const persist = useCallback(
    (next: { role: 'user' | 'assistant'; content: string }[]) => {
      if (user) updateIridologyHistoryChat(user.uid, analysisId, next);
    },
    [analysisId, user],
  );

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    if (!user) {
      onSignIn();
      setError('Sign in to ask follow-up questions about your iris analysis.');
      return;
    }
    const userMsg = { id: newMsgId(), role: 'user' as const, content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setError('');
    try {
      const history = next.slice(0, -1).map(({ role, content }) => ({ role, content }));
      let reply: string;
      if (isLocal && localContext) {
        reply = (
          await sendLivingKnowledgeChat(user, {
            message: text,
            context: localContext,
            scope: 'iridology',
            history,
          })
        ).reply;
      } else {
        reply = (await sendIridologyFollowupChat(user, analysisId, { message: text, history })).reply;
      }
      const withAssistant = [...next, { id: newMsgId(), role: 'assistant' as const, content: reply }];
      setMessages(withAssistant);
      persist(withAssistant.map(({ role, content }) => ({ role, content })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
      setMessages(messages);
    } finally {
      setBusy(false);
    }
  };

  const prompts = [
    'What does my constitutional type mean in plain language?',
    'Which observations had the lowest confidence and why?',
    'How should I retake the photo for better fiber detail?',
    'What would integrated iridology say vs Jensen zones here?',
  ];

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Ask about your analysis</h3>
          <p className="text-[11px] text-slate-400">
            Follow-up chat references your saved report · {HIVE_RESEARCH_LABEL}
          </p>
        </div>
      </div>
      {messages.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-8 bg-indigo-600/25 border border-indigo-500/25 text-indigo-50'
                  : 'mr-6 bg-slate-800/80 border border-slate-700 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDraft(p)}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) void send();
          }}
          placeholder="Ask a follow-up about your iris report…"
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500/50"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void send()}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
    </div>
  );
}

function SavedAnalyses({
  user,
  activeId,
  refreshKey,
  onSelect,
}: {
  user: User | null;
  activeId: string | null;
  refreshKey: number;
  onSelect: (item: IridologySavedAnalysis) => void;
}) {
  const [rows, setRows] = useState<IridologyHistorySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const local = loadIridologyHistory(user?.uid ?? null);
    if (!user) {
      setRows(local.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        methodology: row.methodology,
        eye: row.eye,
        photoQuality: row.structured.photoQuality,
        constitutionalLabel: row.structured.constitutionalType?.label,
        summaryLine: row.structured.integratedSummary?.slice(0, 160) || row.reply.slice(0, 160),
        chatCount: row.chatMessages?.length ?? 0,
      })));
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchIridologyHistory(user)
      .then((server) => {
        if (!cancelled) setRows(mergeIridologyHistory(server, local));
      })
      .catch(() => {
        if (!cancelled) {
          setRows(
            local.map((row) => ({
              id: row.id,
              createdAt: row.createdAt,
              methodology: row.methodology,
              eye: row.eye,
              photoQuality: row.structured.photoQuality,
              constitutionalLabel: row.structured.constitutionalType?.label,
              summaryLine: row.structured.integratedSummary?.slice(0, 160) || row.reply.slice(0, 160),
              chatCount: row.chatMessages?.length ?? 0,
            })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  if (!rows.length && !loading) return null;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-indigo-300" />
        <h3 className="text-sm font-bold text-white">Your saved analyses</h3>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : null}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              const local = loadIridologyHistory(user?.uid ?? null).find((item) => item.id === row.id);
              if (local) {
                onSelect(local);
                return;
              }
              if (user) {
                fetchIridologyAnalysis(user, row.id)
                  .then((full) => {
                    saveIridologyHistoryItem(user.uid, {
                      ...full,
                      structured: full.structured,
                      chatMessages: full.chatMessages ?? [],
                    });
                    onSelect({
                      ...full,
                      structured: full.structured,
                      chatMessages: full.chatMessages ?? [],
                    });
                  })
                  .catch(() => {});
              }
            }}
            className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
              activeId === row.id
                ? 'border-indigo-500/50 bg-indigo-500/15'
                : 'border-slate-700 hover:border-indigo-500/30 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>{new Date(row.createdAt).toLocaleString()}</span>
              <span className="text-indigo-300">{row.eye} eye</span>
              {row.photoQuality ? <span>photo: {row.photoQuality}</span> : null}
              {row.chatCount ? <span>{row.chatCount} chat msgs</span> : null}
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {row.constitutionalLabel ? `${row.constitutionalLabel} · ` : ''}
              {row.summaryLine || 'Iris analysis'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  user: User | null;
  onSignIn: () => void;
};

export default function IridologyScanPanel({ user, onSignIn }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [galleryTarget, setGalleryTarget] = useState<'left' | 'right'>('left');
  const [cameraEye, setCameraEye] = useState<'left' | 'right' | null>(null);
  const [methodology, setMethodology] = useState<IridologyMethodology>('integrated');
  const [eye, setEye] = useState<Exclude<IridologyEye, 'unknown'>>('left');
  const [notes, setNotes] = useState('');
  const [leftPhoto, setLeftPhoto] = useState<PlantPhotoAttachment | null>(null);
  const [rightPhoto, setRightPhoto] = useState<PlantPhotoAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needCredits, setNeedCredits] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [reply, setReply] = useState('');
  const [structured, setStructured] = useState<IridologyStructuredReport | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [saved, setSaved] = useState<IridologySavedAnalysis | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chargedUsd, setChargedUsd] = useState<number | undefined>();
  const [creditBalanceUsd, setCreditBalanceUsd] = useState<number | undefined>();
  const [showTips, setShowTips] = useState(true);

  const photoCount = eye === 'both' ? 2 : 1;

  const setPhoto = (side: 'left' | 'right', photo: PlantPhotoAttachment) => {
    if (side === 'left') setLeftPhoto(photo);
    else setRightPhoto(photo);
    setError('');
    setNeedCredits(false);
  };

  const onGalleryFiles = async (files: FileList | null, side: 'left' | 'right') => {
    if (!files?.length) return;
    try {
      const attachments = await filesToVisionAttachments(Array.from(files).slice(0, 1));
      if (!attachments.length) {
        setError('Please choose an image file (JPEG, PNG, or HEIC).');
        return;
      }
      setPhoto(side, attachments[0]!);
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
    const photos: PlantPhotoAttachment[] = [];
    if (eye === 'both') {
      if (leftPhoto) photos.push(leftPhoto);
      if (rightPhoto) photos.push(rightPhoto);
    } else if (eye === 'left' && leftPhoto) {
      photos.push(leftPhoto);
    } else if (eye === 'right' && rightPhoto) {
      photos.push(rightPhoto);
    }
    if (!photos.length) {
      setError('Take or upload at least one clear iris photo using the camera above.');
      return;
    }
    if (eye === 'both' && photos.length < 2) {
      setError('Both mode needs a left and right eye photo — capture each eye separately.');
      return;
    }
    const laterality = eye === 'both' ? 'both' : eye === 'left' ? 'left' : 'right';
    setBusy(true);
    setError('');
    setNeedCredits(false);
    setReply('');
    setStructured(null);
    setAnalysisId(null);
    setSaved(null);
    const previewUrls = photos.map((p) => p.previewUrl).filter((u): u is string => !!u);
    try {
      const result = await sendIridologyAnalyze(user, {
        methodology,
        eye: laterality,
        notes: notes.trim(),
        attachment: photos.length === 1 ? photos[0] : undefined,
        attachments: photos.length > 1 ? photos : undefined,
      });
      setReply(result.reply);
      setStructured(result.structured);
      setChargedUsd(result.chargedUsd);
      setCreditBalanceUsd(result.creditBalanceUsd);
      const id = result.analysisId || `local_${Date.now()}`;
      const record = makeIridologyHistoryRecord({
        id,
        methodology,
        eye: laterality,
        notes: notes.trim(),
        reply: result.reply,
        structured: result.structured,
        photoPreviewUrls: previewUrls,
      });
      saveIridologyHistoryItem(user.uid, record);
      setAnalysisId(id);
      setSaved(record);
      setRefreshKey((n) => n + 1);
    } catch (err) {
      if (err instanceof PlantCreditsError) {
        setNeedCredits(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const openSaved = (item: IridologySavedAnalysis) => {
    setReply(item.reply);
    setStructured(item.structured);
    setAnalysisId(item.id);
    setSaved(item);
    setMethodology((item.structured.methodology as IridologyMethodology) || (item.methodology as IridologyMethodology) || 'integrated');
    if (item.eye === 'both') setEye('both');
    else if (item.eye === 'right') setEye('right');
    else setEye('left');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-950/80 to-slate-950 p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
          <ScanEye className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
            Hive Research vision
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-white">AI iris photo analysis</h2>
          <p className="text-sm text-slate-400 mt-1">
            {HIVE_RESEARCH_LABEL} · {HIVE_RESEARCH_POWERED_BY}. Jensen zones, European signs, and
            constitutional typing from a clear iris photo.
          </p>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Reads anatomy first (pupil, collarette, stroma, limbus), then maps visible signs to Jensen clock
            sectors and European Deck/Felke signs — constitution, tissue quality, and organ-zone emphasis.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTips((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-indigo-500/10"
        >
          <span className="text-sm font-bold text-indigo-100 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-300" />
            How to take a clear iris photo
          </span>
          {showTips ? (
            <ChevronUp className="w-4 h-4 text-indigo-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-300" />
          )}
        </button>
        {showTips ? (
          <div className="px-4 pb-4 space-y-3 border-t border-indigo-500/15">
            <ol className="mt-3 space-y-2">
              {IRIDOLOGY_PHOTO_TIPS.map((tip, i) => (
                <li key={tip.title} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-200 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="text-white">{tip.title}.</strong> {tip.detail}
                  </span>
                </li>
              ))}
            </ol>
            <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <p className="font-bold text-emerald-300 mb-1">Do</p>
                <ul className="text-emerald-100/90 space-y-0.5">
                  {IRIDOLOGY_PHOTO_DOS.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5">
                <p className="font-bold text-rose-300 mb-1">Avoid</p>
                <ul className="text-rose-100/85 space-y-0.5">
                  {IRIDOLOGY_PHOTO_AVOIDS.map((item) => (
                    <li key={item}>✗ {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <SavedAnalyses user={user} activeId={analysisId} refreshKey={refreshKey} onSelect={openSaved} />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100/90 mb-4 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          Tap <strong className="text-amber-100">Take iris photo</strong> to open the live camera with an
          on-screen iris guide. Blurry or partial photos produce limited reports — retake if quality is poor.
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
            {(['left', 'right', 'both'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setEye(side)}
                className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                  eye === side
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-100'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`grid gap-3 mb-4 ${eye === 'both' ? 'sm:grid-cols-2' : ''}`}>
        {(eye === 'left' || eye === 'both') && (
          <PhotoSlot
            label={eye === 'both' ? 'Left eye' : 'Iris photo'}
            photo={leftPhoto}
            onClear={() => setLeftPhoto(null)}
            onTakePhoto={() => setCameraEye('left')}
            onGallery={() => {
              setGalleryTarget('left');
              galleryRef.current?.click();
            }}
          />
        )}
        {(eye === 'right' || eye === 'both') && (
          <PhotoSlot
            label={eye === 'both' ? 'Right eye' : 'Iris photo'}
            photo={rightPhoto}
            onClear={() => setRightPhoto(null)}
            onTakePhoto={() => setCameraEye('right')}
            onGallery={() => {
              setGalleryTarget('right');
              galleryRef.current?.click();
            }}
          />
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onGalleryFiles(e.target.files, galleryTarget);
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
      {needCredits ? (
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

      <p className="text-[10px] text-slate-500 mt-3 mb-4">
        Up to {photoCount} photo{photoCount > 1 ? 's' : ''} per request. Uses Bhive Credits unless
        admin-exempt.
      </p>

      {structured && reply ? (
        <div className="mt-6 pt-6 border-t border-indigo-500/20 space-y-4">
          <IrisReport
            reply={reply}
            structured={structured}
            chargedUsd={chargedUsd}
            creditBalanceUsd={creditBalanceUsd}
            onAddCredits={() => void addCredits()}
          />
          {analysisId ? (
            <FollowupChat
              key={analysisId}
              analysisId={analysisId}
              user={user}
              onSignIn={onSignIn}
              initialMessages={saved?.chatMessages}
              localContext={saved ? followUpContextFromAnalysis(saved) : undefined}
            />
          ) : null}
        </div>
      ) : null}

      {cameraEye ? (
        <IrisCameraOverlay
          eye={cameraEye}
          onCapture={(photo) => setPhoto(cameraEye, photo)}
          onClose={() => setCameraEye(null)}
        />
      ) : null}
    </section>
  );
}
