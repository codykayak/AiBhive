import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { normalizeWikiImageUrl } from '../../../lib/oregonPlantMedicine/commonsImage';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Topic card image with graceful fallback when Commons/Wikimedia URLs fail. */
export default function ResearchTopicImage({ src, alt, className }: Props) {
  const [current, setCurrent] = useState(() => normalizeWikiImageUrl(src));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(normalizeWikiImageUrl(src));
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 ${className ?? ''}`}
        aria-label={alt}
      >
        <ImageIcon className="w-8 h-8 text-slate-600" />
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
