import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

type Topic = {
  id: number;
  label: string;
  desc: string;
  position: [number, number, number];
};

const topics: Topic[] = [
  {
    id: 1,
    label: 'Star Forts',
    desc: 'Ancient geometric power structures found worldwide',
    position: [3.2, 1.4, -1],
  },
  {
    id: 2,
    label: 'World Fairs',
    desc: "The mysterious 'temporary' cities of the 19th century",
    position: [2.1, -1.8, 2],
  },
  {
    id: 3,
    label: 'Mud Flood Geo',
    desc: 'Evidence of a global cataclysmic burial event',
    position: [1.5, -2.3, -0.8],
  },
  {
    id: 4,
    label: 'Giant Trees & People',
    desc: 'The lost megafauna and megastructure era',
    position: [-2.4, -2.1, -1.2],
  },
  {
    id: 5,
    label: 'Underground Systems',
    desc: 'Vast tunnel networks connecting ancient civilizations',
    position: [2.8, 0.8, 1.5],
  },
  {
    id: 6,
    label: 'Sumerian • Egyptian • Arcadian',
    desc: 'The true origins of high civilization',
    position: [-2.9, 0.3, -2],
  },
  {
    id: 7,
    label: 'Cuneiform Translator',
    desc: 'Decoding the oldest known writing systems',
    position: [1.2, 2.6, -1.8],
  },
  {
    id: 8,
    label: 'Structural AI Analysis',
    desc: 'Re-examining impossible ancient engineering',
    position: [-1.4, -2.6, 2.2],
  },
  {
    id: 9,
    label: 'Strange Mechanics',
    desc: 'Advanced technology hidden in plain sight',
    position: [-3.1, -0.9, 1.8],
  },
];

export default function HeroTartaria3D() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0503] z-10">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <pointLight position={[15, 10, 10]} intensity={2.8} color="#ffcc77" />
          <pointLight position={[-12, -15, -8]} intensity={1.8} color="#aa5522" />

          <group>
            <mesh>
              <sphereGeometry args={[4.2, 90, 90]} />
              <meshPhongMaterial color="#1c1208" emissive="#2a1a0f" shininess={10} specular="#ffddaa" />
            </mesh>

            <mesh>
              <sphereGeometry args={[4.5, 64, 64]} />
              <meshBasicMaterial color="#ff8833" transparent opacity={0.22} />
            </mesh>

            {topics.map((topic, i) => (
              <group key={i} position={topic.position}>
                <mesh
                  onClick={() => setSelectedTopic(topic)}
                  onPointerOver={() => {
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = 'default';
                  }}
                >
                  <sphereGeometry args={[0.13, 36, 36]} />
                  <meshStandardMaterial color="#ffdd55" emissive="#ffaa00" emissiveIntensity={1.3} />
                </mesh>
                <mesh>
                  <ringGeometry args={[0.22, 0.28, 48]} />
                  <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>

          <Stars radius={600} depth={90} count={1500} factor={5} fade />
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

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-7xl md:text-[7rem] font-black tracking-[-0.05em] text-white leading-none mb-3"
        >
          THE OLD WORLD
        </motion.h1>
        <p className="text-lg sm:text-2xl md:text-3xl text-amber-300 tracking-widest">
          Tartaria • Mud Flood • Antiquitech • Forgotten Civilizations
        </p>
      </div>

      <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 text-white/70 text-sm flex flex-col items-center z-50 text-center px-4 pointer-events-none">
        <div className="tracking-widest uppercase text-xs sm:text-sm">Drag to rotate • Scroll to zoom • Click pins</div>
        <div className="mt-3 text-sm sm:text-base font-semibold text-amber-400 animate-bounce">
          ↓ Scroll down to explore tools ↓
        </div>
      </div>

      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-8 right-8 z-40 bg-black/95 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md backdrop-blur-xl"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-amber-400 mb-4">{selectedTopic.label}</h3>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed">{selectedTopic.desc}</p>
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className="mt-6 px-6 py-2.5 border border-white/30 rounded-full hover:bg-white/10 transition text-sm text-white"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
