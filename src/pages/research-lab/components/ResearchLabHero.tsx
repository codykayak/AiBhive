import { motion, useScroll, useTransform } from 'motion/react';
import { TechParallaxHeroLayers } from '../../../components/TechParallaxSection';
import StartResearchingButton from './StartResearchingButton';

const TAGLINE =
  'You now have access to the most powerful research tools known to Humankind.';

export default function ResearchLabHero() {
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 700], [0, 120]);
  const heroContentY = useTransform(scrollY, [0, 700], [0, 40]);

  return (
    <section
      className="relative flex min-h-[85vh] flex-col overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-0"
      aria-label="Research Lab hero"
    >
      <TechParallaxHeroLayers />

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-bee-black/40 via-bee-black/20 to-bee-black/75 z-10" />
        <div className="absolute inset-0 tech-scanlines z-[2] opacity-[0.12]" />
        <motion.div
          style={{ y: heroParallaxY }}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6 }}
          className="w-full h-[115%] -top-[7%] absolute"
        >
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/tartar-map-hero.jpg"
          >
            <source src="/aibhive-research_data-ai-library.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>

      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none z-[1]" />

      <motion.div
        style={{ y: heroContentY }}
        className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 items-center px-4 text-center sm:px-6 lg:px-8"
      >
        <div className="w-full">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-bee-amber font-semibold text-sm uppercase tracking-widest mb-6"
          >
            AiBhive · Research Lab
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-bee-amber leading-[1.08] mb-8 tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]"
          >
            Research — Community Sourced Library
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-hidden w-full mb-10"
            style={{
              maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
            }}
            aria-hidden
          >
            <div className="flex w-max gap-16 rl-hero-marquee whitespace-nowrap">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 drop-shadow-[0_1px_12px_rgba(0,0,0,0.9)]">
                {TAGLINE}
              </span>
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 drop-shadow-[0_1px_12px_rgba(0,0,0,0.9)]">
                {TAGLINE}
              </span>
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 drop-shadow-[0_1px_12px_rgba(0,0,0,0.9)]">
                {TAGLINE}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StartResearchingButton />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
