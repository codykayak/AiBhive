import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

type Intensity = 'subtle' | 'medium' | 'strong';

const orbOpacity: Record<Intensity, string> = {
  subtle: 'opacity-[0.35]',
  medium: 'opacity-[0.5]',
  strong: 'opacity-[0.65]',
};

interface TechAmbienceLayerProps {
  className?: string;
  intensity?: Intensity;
  showMesh?: boolean;
}

/** Scroll-linked orbs + mesh — use inside a `relative overflow-hidden` container */
export function TechAmbienceLayer({
  className,
  intensity = 'medium',
  showMesh = true,
}: TechAmbienceLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const orbY1 = useTransform(scrollYProgress, [0, 1], ['-12%', '18%']);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ['10%', '-14%']);
  const orbY3 = useTransform(scrollYProgress, [0, 1], ['-6%', '10%']);
  const meshY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);

  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      aria-hidden
    >
      {showMesh && (
        <motion.div style={{ y: meshY }} className="absolute inset-0 tech-mesh-parallax" />
      )}
      <motion.div
        style={{ y: orbY1 }}
        className={cn(
          'parallax-orb parallax-orb-amber absolute -top-24 -left-24 w-[min(90vw,28rem)] h-[min(90vw,28rem)]',
          orbOpacity[intensity]
        )}
      />
      <motion.div
        style={{ y: orbY2 }}
        className={cn(
          'parallax-orb parallax-orb-cyan absolute top-1/3 -right-32 w-[min(80vw,24rem)] h-[min(80vw,24rem)]',
          orbOpacity[intensity]
        )}
      />
      <motion.div
        style={{ y: orbY3 }}
        className={cn(
          'parallax-orb parallax-orb-amber absolute -bottom-20 left-1/4 w-[min(70vw,20rem)] h-[min(70vw,20rem)]',
          orbOpacity[intensity]
        )}
      />
    </div>
  );
}

interface TechParallaxSectionProps {
  children: ReactNode;
  className?: string;
  ambience?: boolean;
  intensity?: Intensity;
  id?: string;
}

/**
 * Section wrapper with scroll-linked parallax orbs and optional grid mesh.
 */
export default function TechParallaxSection({
  children,
  className,
  ambience = true,
  intensity = 'medium',
  id,
}: TechParallaxSectionProps) {
  return (
    <section id={id} className={cn('relative overflow-hidden', className)}>
      {ambience && <TechAmbienceLayer intensity={intensity} />}
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}

/** Fixed page-level parallax layer (hero depth) */
export function TechParallaxHeroLayers() {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  const orbY = useTransform(scrollY, [0, 800], [0, -100]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div style={{ y: bgY }} className="absolute inset-0 tech-mesh-parallax opacity-60" />
      <motion.div
        style={{ y: orbY }}
        className="parallax-orb parallax-orb-cyan absolute top-1/4 right-[10%] w-72 h-72 opacity-40"
      />
      <motion.div
        style={{ y: orbY }}
        className="parallax-orb parallax-orb-amber absolute bottom-0 left-[5%] w-96 h-96 opacity-30"
      />
    </div>
  );
}
