import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';

type Topic = {
  id: number;
  label: string;
  desc: string;
  position: [number, number, number];
};

const topics: Topic[] = [
  {
    id: 0,
    label: 'U.S. Map Collaborative',
    desc: 'Crowdsourced maps of reset-era infrastructure and anomalies',
    position: [-2.8, 1.8, 0.5],
  },
  {
    id: 1,
    label: 'Star Forts',
    desc: 'Geometric fortifications found worldwide with unexplained precision',
    position: [3.2, 1.4, -1],
  },
  {
    id: 2,
    label: 'Architectural Documentation',
    desc: 'Cataloging impossible masonry, star forts, and pre-reset grandeur',
    position: [-1.8, 2.4, -1.5],
  },
  {
    id: 3,
    label: 'World Fairs',
    desc: 'Temporary cities of impossible scale — built and vanished overnight',
    position: [2.1, -1.8, 2],
  },
  {
    id: 4,
    label: 'Mud Flood Geo',
    desc: 'Evidence of a global cataclysmic burial event',
    position: [1.5, -2.3, -0.8],
  },
  {
    id: 5,
    label: 'Giant Trees & People',
    desc: 'The lost megafauna and megastructure era',
    position: [-2.4, -2.1, -1.2],
  },
  {
    id: 6,
    label: 'Underground Systems',
    desc: 'Vast tunnel networks connecting ancient civilizations',
    position: [2.8, 0.8, 1.5],
  },
  {
    id: 7,
    label: 'Sumerian • Egyptian • Arcadian',
    desc: 'The true origins of high civilization',
    position: [-2.9, 0.3, -2],
  },
  {
    id: 8,
    label: 'Cuneiform Translator',
    desc: 'Decoding the oldest known writing systems',
    position: [1.2, 2.6, -1.8],
  },
  {
    id: 9,
    label: 'Structural AI Analysis',
    desc: 'Re-examining impossible ancient engineering',
    position: [-1.4, -2.6, 2.2],
  },
  {
    id: 10,
    label: 'Strange Mechanics',
    desc: 'Advanced technology hidden in plain sight',
    position: [-3.1, -0.9, 1.8],
  },
];

type GlobeProps = {
  onSelectTopic: (topic: Topic) => void;
};

function Globe({ onSelectTopic }: GlobeProps) {
  const globeRef = useRef<THREE.Group>(null);

  return (
    <group ref={globeRef}>
      <mesh>
        <sphereGeometry args={[4.2, 90, 90]} />
        <meshPhongMaterial color="#1c1208" emissive="#2a1a0f" shininess={8} specular="#ffddaa" />
      </mesh>

      <mesh>
        <sphereGeometry args={[4.45, 64, 64]} />
        <meshBasicMaterial color="#ff8833" transparent opacity={0.18} />
      </mesh>

      {topics.map((topic) => (
        <group key={topic.id} position={topic.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelectTopic(topic);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.13, 36, 36]} />
            <meshStandardMaterial color="#ffdd55" emissive="#ffaa00" emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.28, 48]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function HeroTartaria3D() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0503]">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[15, 10, 10]} intensity={2.5} color="#ffcc77" />
          <pointLight position={[-12, -15, -8]} intensity={1.8} color="#aa5522" />

          <Globe onSelectTopic={setSelectedTopic} />
          <Stars radius={600} depth={90} count={1500} factor={5} saturation={0} fade speed={0.5} />
          <Environment preset="night" />

          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={7.5}
            maxDistance={25}
            autoRotate
            autoRotateSpeed={0.12}
            enableDamping
            dampingFactor={0.1}
          />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-5xl sm:text-7xl md:text-[7rem] font-black tracking-[-0.05em] text-white leading-none mb-3">
            THE OLD WORLD
          </h1>
          <p className="text-lg sm:text-2xl md:text-3xl text-amber-400/90 tracking-wide">
            Tartaria • Mud Flood • Antiquitech • Forgotten Civilizations
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-8 right-8 z-30 bg-black/95 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md backdrop-blur-xl shadow-2xl"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-3">{selectedTopic.label}</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{selectedTopic.desc}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('bhive:open-assistant', {
                      detail: {
                        prefill: `Help me research ${selectedTopic.label.toLowerCase()} — Fable Scrape sources, OCR workflow, and RAG queries.`,
                        label: 'Old World Research',
                      },
                    }),
                  );
                }}
                className="text-sm bg-amber-500 text-black font-bold px-5 py-2.5 rounded-full hover:bg-amber-400 transition"
              >
                Research with Bhive
              </button>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="text-sm border border-white/30 px-5 py-2.5 rounded-full hover:bg-white/10 transition text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs sm:text-sm z-20 tracking-widest uppercase">
        Drag to rotate • Scroll to zoom • Click pins
      </div>
    </div>
  );
}
