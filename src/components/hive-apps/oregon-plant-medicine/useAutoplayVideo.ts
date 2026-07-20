import { useEffect, useRef } from 'react';

/** Muted autoplay when the video scrolls into view; pause when off-screen. */
export function useAutoplayVideo(deps: unknown[] = []) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25, rootMargin: '40px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
