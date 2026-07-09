import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const topics = [
  { label: 'Star Forts', position: { top: '35%', left: '15%' } },
  { label: 'Mud Flood', position: { top: '55%', left: '28%' } },
  { label: "World's Fairs", position: { top: '42%', left: '68%' } },
  { label: 'Giant Trees', position: { top: '65%', left: '45%' } },
  { label: 'Free Energy', position: { top: '28%', left: '82%' } },
  { label: 'Underground', position: { top: '72%', left: '62%' } },
  { label: 'Cuneiform', position: { top: '22%', left: '48%' } },
  { label: 'Antiquitech', position: { top: '48%', left: '12%' } },
];

export default function HeroTartaria() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 15]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden bg-black flex items-center justify-center">
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 bg-[url('/tartaria-bg.jpg')] bg-cover bg-center opacity-40"
      />

      <motion.div
        style={{ y: y1, rotate }}
        className="relative w-full max-w-5xl aspect-[16/10] cursor-pointer group mx-4"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="/tartaria-map-main.jpg"
          alt="Tartarian World Map"
          className="w-full h-full object-cover rounded-2xl shadow-2xl border border-amber-500/30"
        />

        {topics.map((topic, i) => (
          <motion.button
            key={topic.label}
            type="button"
            className="absolute bg-black/80 text-amber-400 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-500/50 backdrop-blur-sm pointer-events-auto"
            style={topic.position}
            whileHover={{
              scale: 1.2,
              backgroundColor: '#78350f',
              color: '#fcd34d',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('bhive:open-assistant', {
                  detail: {
                    prefill: `Help me research ${topic.label.toLowerCase()} — Fable Scrape sources, OCR workflow, and RAG queries.`,
                    label: 'Old World Research',
                  },
                }),
              );
            }}
          >
            {topic.label}
          </motion.button>
        ))}
      </motion.div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-6 pointer-events-none">
        <motion.h1
          className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-tighter mb-4 drop-shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
        >
          THE OLD WORLD
        </motion.h1>
        <p className="text-lg sm:text-2xl text-amber-300 max-w-2xl drop-shadow-md">
          Uncovering the hidden history of Tartaria, Mud Floods, and the Great Reset
        </p>
      </div>

      <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <p className="text-sm font-semibold text-amber-400 animate-bounce">↓ Scroll down to explore tools ↓</p>
      </div>
    </div>
  );
}
