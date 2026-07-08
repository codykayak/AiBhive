import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, useTexture } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type * as THREE from 'three';

const TOPICS = [
  { label: 'U.S. Map Collaborative', position: [-1.2, 1.8, 0] as const },
  { label: 'Star Forts', position: [2.5, 1.2, -1] as const },
  { label: 'World Fairs', position: [-2.8, -0.8, 1.5] as const },
  { label: 'Mud Flood Geo', position: [1.8, -2.1, 0.5] as const },
  { label: 'Giant Trees & People', position: [-1.5, -1.5, -2] as const },
  { label: 'Underground Systems', position: [2.2, 0.5, 2] as const },
  { label: 'Architectural Documentation', position: [-2.2, 2.2, -1] as const },
  { label: 'Strange Mechanics', position: [3, -1.5, 0] as const },
  { label: 'Sumerian • Egyptian • Arcadian', position: [-3, 0, 1] as const },
  { label: 'Cuneiform Translator', position: [1.5, 2.5, -1.5] as const },
  { label: 'Structural AI Analysis', position: [-1, -2.5, 2] as const },
];

type GlobeProps = {
  onTopicHover: (label: string | null) => void;
};

function Globe({ onTopicHover }: GlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const texture = useTexture('/tartaria-globe-texture.jpg');

  return (
    <group ref={globeRef}>
      <mesh>
        <sphereGeometry args={[3.5, 64, 64]} />
        <meshPhongMaterial map={texture} emissive="#331100" emissiveIntensity={0.2} />
      </mesh>

      {TOPICS.map((topic) => (
        <mesh
          key={topic.label}
          position={topic.position}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            onTopicHover(topic.label);
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
            onTopicHover(null);
          }}
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
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroTartaria3D() {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffddaa" />

          <Globe onTopicHover={setHoveredTopic} />
          <Stars radius={300} depth={50} count={800} factor={4} saturation={0} fade speed={1} />
          <Environment preset="night" />

          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={6}
            maxDistance={18}
            autoRotate
            autoRotateSpeed={0.2}
          />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-tighter text-center"
        >
          THE FORGOTTEN WORLD
        </motion.h1>
        <p className="text-lg sm:text-2xl text-amber-400 mt-4 max-w-2xl text-center">
          Exploring Tartaria • Mud Floods • Antiquitech • Hidden History
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm text-center px-4">
        {hoveredTopic ? (
          <span className="text-amber-300 font-semibold">{hoveredTopic} — click pin to ask Bhive Builder</span>
        ) : (
          <span>Drag to rotate • Scroll to zoom • Hover the pins</span>
        )}
      </div>
    </div>
  );
}
