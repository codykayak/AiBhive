import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { cn } from '../../lib/utils';
import { TechAmbienceLayer } from '../TechParallaxSection';

const VOICE_HERO = '/pros/pros-voice-parallax-hero.png';

type Props = {
  children: ReactNode;
  className?: string;
  /** Light = amber/white section (default). Dark = cinematic night overlay. */
  variant?: 'light' | 'dark';
};

/** Full-bleed parallax hero for AiBhive Voice — scroll-linked image + ambient orbs. */
export default function ProsVoiceParallaxSection({
  children,
  className,
  variant = 'light',
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['-6%', '10%']);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1.1, 1.04]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-3%']);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.45, 1], [0.35, 0.55, 0.35]);
  const waveY = useTransform(scrollYProgress, [0, 1], ['4%', '-6%']);

  const light = variant === 'light';

  return (
    <section
      id="voice"
      ref={ref}
      className={cn(
        'relative overflow-hidden scroll-mt-20 border-y',
        light
          ? 'min-h-0 border-amber-100 bg-gradient-to-b from-amber-50/80 to-white'
          : 'min-h-[min(100vh,920px)] border-amber-500/20',
        className,
      )}
      aria-label="AiBhive Voice after-hours and overflow line"
    >
      {/* Parallax photo background */}
      <motion.div
        style={{ y: bgY, scale: bgScale }}
        className="absolute inset-0 will-change-transform"
        aria-hidden
      >
        <img
          src={VOICE_HERO}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-[center_35%]',
            light && 'opacity-35 saturate-[0.85]',
          )}
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* Readability overlays */}
      {light ? (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/95 via-amber-50/88 to-white/75"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/90"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-900/78 to-slate-900/45"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900/40"
            aria-hidden
          />
        </>
      )}

      <motion.div
        style={{ opacity: glowOpacity }}
        className={cn(
          'absolute inset-0',
          light
            ? 'bg-[radial-gradient(ellipse_70%_55%_at_15%_40%,rgba(245,166,35,0.18),transparent_60%)]'
            : 'bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,rgba(245,166,35,0.22),transparent_55%)]',
        )}
        aria-hidden
      />

      <TechAmbienceLayer
        intensity={light ? 'subtle' : 'strong'}
        showMesh
        className={cn(light ? 'opacity-40' : 'opacity-80 mix-blend-screen')}
      />

      {/* Floating voice-wave accent */}
      <motion.div
        style={{ y: waveY }}
        className={cn(
          'absolute bottom-[10%] right-[6%] hidden lg:flex gap-1 items-end pointer-events-none',
          light ? 'opacity-20' : 'opacity-30',
        )}
        aria-hidden
      >
        {[32, 48, 64, 40, 56, 36, 52].map((h, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-amber-500"
            style={{ height: h }}
            animate={{ scaleY: [0.6, 1, 0.7, 1] }}
            transition={{ duration: 1.2 + i * 0.08, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      <motion.div style={{ y: contentY }} className="relative z-[1] py-16 sm:py-20">
        {children}
      </motion.div>
    </section>
  );
}
