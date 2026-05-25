import { useState } from 'react';

/** Tries candidate paths in order; falls back when file missing (e.g. before user uploads city images). */
export default function ResponsiveImage({ candidates, alt, className, style }) {
  const [index, setIndex] = useState(0);
  const src = candidates[index] ?? candidates[candidates.length - 1];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => {
        if (index < candidates.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}
