import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FlipHorizontal, Loader2, X } from 'lucide-react';
import { compressPlantImageFile } from '../../../lib/oregonPlantMedicine/compressPlantImage';
import {
  IRIDOLOGY_PHOTO_DONTS,
  IRIDOLOGY_PHOTO_DOS,
  IRIDOLOGY_PHOTO_STEPS,
  iridologyEyeCaptureLabel,
} from '../../../lib/oregonPlantMedicine/iridologyPhotoGuide';
import type { PlantPhotoAttachment } from '../../../lib/oregonPlantMedicine/plantMedicineApi';

type Props = {
  eye: 'left' | 'right';
  onCapture: (photo: PlantPhotoAttachment) => void;
  onClose: () => void;
};

type Facing = 'user' | 'environment';

export default function IridologyCameraModal({ eye, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<Facing>('user');
  const [starting, setStarting] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [showTips, setShowTips] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: Facing) => {
    setStarting(true);
    setError('');
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not available in this browser — use Gallery instead.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
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
  }, [stopStream]);

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

  const onFallbackPick = async (fileList: FileList | null) => {
    const file = fileList?.[0];
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
          <h2 className="text-sm font-bold text-white">{iridologyEyeCaptureLabel(eye)}</h2>
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
        {/* Iris framing guide */}
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
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Clear photo checklist</p>
            <button type="button" onClick={() => setShowTips(false)} className="text-[10px] text-slate-500 hover:text-slate-300">
              Hide
            </button>
          </div>
          <ol className="space-y-2">
            {IRIDOLOGY_PHOTO_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-2 text-xs text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-200 font-bold flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                <span>
                  <strong className="text-white">{step.title}.</strong> {step.detail}
                </span>
              </li>
            ))}
          </ol>
          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <ul className="text-emerald-200/90 space-y-1">
              {IRIDOLOGY_PHOTO_DOS.map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
            <ul className="text-rose-200/80 space-y-1">
              {IRIDOLOGY_PHOTO_DONTS.map((t) => (
                <li key={t}>✗ {t}</li>
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
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          className="p-3 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800"
          aria-label="Switch camera"
        >
          <FlipHorizontal className="w-5 h-5" />
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
          onClick={() => fallbackRef.current?.click()}
          className="text-xs font-semibold text-slate-400 hover:text-white px-2"
        >
          Gallery
        </button>
        <input
          ref={fallbackRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            void onFallbackPick(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
