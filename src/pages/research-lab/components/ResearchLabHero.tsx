import { motion, useScroll, useTransform } from 'motion/react';
import { TechParallaxHeroLayers } from '../../../components/TechParallaxSection';
import StartResearchingButton from './StartResearchingButton';

const TAGLINE =
  'Multi-agent research — scrape, OCR, translate, synthesize, publish. The most powerful research tools known to humankind.';

export default function ResearchLabHero() {
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 700], [0, 120]);
  const heroContentY = useTransform(scrollY, [0, 700], [0, 40]);

  return (
    <section
      className="relative flex min-h-[85vh] flex-col overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-0 rl-tools-hero"
      aria-label="Research Lab hero"
    >
      <TechParallaxHeroLayers />

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-bee-black/50 via-bee-black/25 to-bee-black/80 z-10" />
        <div className="absolute inset-0 tech-scanlines z-[2] opacity-[0.14]" />
        <motion.div
          style={{ y: heroParallaxY }}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6 }}
          className="w-full h-[115%] -top-[7%] absolute"
        >
          <img
            src="/rl-hero-research-tools.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-55"
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
            aria-hidden
          />
          <video
            className="w-full h-full object-cover mix-blend-lighten opacity-70"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/rl-hero-research-tools.png"
          >
            <source src="/aibhive-research_data-ai-library.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>

      <div className="absolute inset-0 aurora-bg opacity-25 pointer-events-none z-[1]" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-40 bg-gradient-to-t from-[#050810] to-transparent"
        aria-hidden
      />

      <motion.div
        style={{ y: heroContentY }}
        className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 items-center px-4 text-center sm:px-6 lg:px-8"
      >
        <div className="w-full">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-bee-amber font-semibold text-sm uppercase tracking-[0.22em] mb-6"
          >
            AiBhive · Research tools
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-bee-amber leading-[1.08] mb-6 tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]"
          >
            Research — Community Sourced Library
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-slate-200/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]"
          >
            Specialized AI agents combined for optimal Hive-credit pricing and start-to-finish depth —
            then publish what you learn so the communal library compounds for every researcher.
          </motion.p>

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
