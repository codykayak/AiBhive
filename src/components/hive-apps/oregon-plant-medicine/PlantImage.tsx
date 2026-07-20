import { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';

const thumbCache = new Map<string, string>();

async function wikipediaFallback(scientificName: string): Promise<string | null> {
  if (thumbCache.has(scientificName)) return thumbCache.get(scientificName) ?? null;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail?: { source?: string } };
    const url = data.thumbnail?.source?.replace(/\/(\d+)px-/, '/640px-') ?? null;
    if (url) thumbCache.set(scientificName, url);
    return url;
  } catch {
    return null;
  }
}

type Props = {
  src: string;
  scientificName: string;
  alt: string;
  className?: string;
  plantId?: string;
};

/** Plant photo with local-file and Wikipedia fallbacks when remote URLs fail. */
export default function PlantImage({ src, scientificName, alt, className, plantId }: Props) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  const onError = () => {
    void (async () => {
      if (plantId && current === src && current !== `/oregon-plant-medicine/${plantId}.jpg`) {
        setCurrent(`/oregon-plant-medicine/${plantId}.jpg`);
        return;
      }
      if (plantId && current.endsWith('.jpg') && !current.includes('-2.jpg')) {
        setCurrent(`/oregon-plant-medicine/${plantId}-2.jpg`);
        return;
      }
      if (plantId && current.includes('-2.jpg')) {
        setCurrent(`/oregon-plant-medicine/${plantId}-3.jpg`);
        return;
      }
      const fallback = await wikipediaFallback(scientificName);
      if (fallback && fallback !== current) {
        setCurrent(fallback);
        return;
      }
      setFailed(true);
    })();
  };

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 ${className ?? ''}`}
        aria-label={alt}
      >
        <Sprout className="w-10 h-10 text-emerald-600/60" />
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
      onError={onError}
    />
  );
}
