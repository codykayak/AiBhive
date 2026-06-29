import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const WORDS = ['Mobile Apps', 'Web Apps', 'Web Site', 'Source Code'];

export default function FlipHeroWords() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="inline-block relative h-[1.15em] min-w-[12ch] align-bottom overflow-hidden text-bee-amber">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          initial={{ opacity: 0, y: 28, rotateX: -40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -28, rotateX: 40 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-0 whitespace-nowrap"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
