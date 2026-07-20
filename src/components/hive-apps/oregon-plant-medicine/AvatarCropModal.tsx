import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
};

const OUTPUT_SIZE = 512;
/** Must match the crop preview circle size (`w-56` = 14rem). */
const PREVIEW_SIZE = 224;

/** Circular crop UI — pan + zoom, then export a square JPEG for avatar upload. */
export default function AvatarCropModal({ file, onCancel, onConfirm }: Props) {
  const [imageUrl, setImageUrl] = useState('');
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const fit = Math.max(OUTPUT_SIZE / img.naturalWidth, OUTPUT_SIZE / img.naturalHeight);
      setScale(fit * 1.05);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = OUTPUT_SIZE;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = size / 2 - drawW / 2 + offset.x;
    const y = size / 2 - drawH / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
  }, [scale, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview, natural]);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => setDragging(false);

  const exportCrop = async () => {
    const img = imgRef.current;
    if (!img) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = OUTPUT_SIZE;
    exportCanvas.height = OUTPUT_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const exportScale = scale * (OUTPUT_SIZE / PREVIEW_SIZE);

    const drawW = img.naturalWidth * exportScale;
    const drawH = img.naturalHeight * exportScale;
    const x = OUTPUT_SIZE / 2 - drawW / 2 + offset.x * (OUTPUT_SIZE / PREVIEW_SIZE);
    const y = OUTPUT_SIZE / 2 - drawH / 2 + offset.y * (OUTPUT_SIZE / PREVIEW_SIZE);
    ctx.drawImage(img, x, y, drawW, drawH);

    const blob = await new Promise<Blob | null>((resolve) =>
      exportCanvas.toBlob(resolve, 'image/jpeg', 0.92),
    );
    if (!blob) return;
    onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
  };

  const minScale = Math.max(OUTPUT_SIZE / natural.w, OUTPUT_SIZE / natural.h) * 0.5;
  const maxScale = minScale * 4;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Crop your photo</h3>
          <p className="text-xs text-slate-400 mt-1">Drag to reposition. Use the slider to zoom. Only the circle is shown on your profile.</p>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div
            className="relative w-56 h-56 rounded-full overflow-hidden border-2 border-emerald-500/50 bg-slate-900 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Crop preview"
                className="absolute pointer-events-none select-none max-w-none"
                style={{
                  width: natural.w * scale,
                  height: natural.h * scale,
                  left: `calc(50% - ${(natural.w * scale) / 2}px + ${offset.x}px)`,
                  top: `calc(50% - ${(natural.h * scale) / 2}px + ${offset.y}px)`,
                }}
                draggable={false}
              />
            ) : null}
            <div className="absolute inset-0 ring-2 ring-inset ring-emerald-400/30 rounded-full pointer-events-none" />
          </div>

          <div className="w-full flex items-center gap-2 text-slate-400">
            <ZoomOut className="w-4 h-4 shrink-0" />
            <input
              type="range"
              min={minScale}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 shrink-0" />
          </div>

          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag image to center your face
          </p>

          <canvas ref={canvasRef} className="sr-only" aria-hidden />

          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void exportCrop()}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
            >
              Use photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
