import { useEffect } from 'react';
import { X } from 'lucide-react';
import PlantPhoto from './PlantImage';

type Props = {
  src: string;
  scientificName: string;
  alt: string;
  caption?: string;
  credit?: string;
  onClose: () => void;
};

export default function FullscreenImageViewer({
  src,
  scientificName,
  alt,
  caption,
  credit,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Full screen photo"
    >
      <div className="flex items-center justify-between gap-3 p-3 shrink-0">
        <p className="text-xs text-slate-300 truncate min-w-0">{alt}</p>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 shrink-0"
          aria-label="Close full screen"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 p-3 pt-0">
        <button
          type="button"
          className="w-full h-full flex items-center justify-center cursor-zoom-out"
          onClick={onClose}
          aria-label="Close full screen"
        >
          <PlantPhoto
            src={src}
            scientificName={scientificName}
            alt={alt}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
        </button>
      </div>

      {caption || credit ? (
        <p className="shrink-0 px-4 pb-4 pt-2 text-center text-[11px] text-slate-400 leading-relaxed">
          {caption ? `${caption}` : ''}
          {caption && credit ? ' · ' : ''}
          {credit ?? ''}
        </p>
      ) : null}
    </div>
  );
}
