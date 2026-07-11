import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

type Props = {
  src: string;
  alt?: string;
  title?: string;
  sourceUrl?: string;
  caption?: string;
  onClose: () => void;
};

/**
 * Full-viewport image inspector for archive / harvest results.
 */
export default function ArchiveImageLightbox({ src, alt, title, sourceUrl, caption, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || alt || 'Inspect image'}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="max-w-6xl w-full max-h-[92vh] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || sourceUrl) && (
          <div className="flex items-start justify-between gap-3 text-slate-200 px-1">
            <div className="min-w-0">
              {title && <p className="font-semibold text-sm sm:text-base truncate">{title}</p>}
              {caption && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{caption}</p>}
            </div>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-sky-400 inline-flex items-center gap-1 hover:underline"
              >
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-[#0a0a0c] border border-white/10">
          <img
            src={src}
            alt={alt || title || 'Archive image'}
            className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="text-[11px] text-slate-500 text-center">Click outside or press Esc to close</p>
      </div>
    </div>
  );
}
