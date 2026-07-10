import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { COMMUNAL_TOPICS, type CommunalTopic } from '../communalLibraryTopics';
import styles from '../researchLab.module.css';

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function TopicNode({
  topic,
  selected,
  onSelect,
}: {
  topic: CommunalTopic;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(`hsl(${topic.hue} 85% 55%)`), [topic.hue]);
  const scale = selected || hovered ? 1.35 : 1;

  useFrame((_, dt) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += dt * 0.35;
    const target = scale;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  return (
    <group position={topic.position}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(topic.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected || hovered ? 0.85 : 0.35}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh>
      <Html distanceFactor={8} position={[0, 0.55, 0]} center>
        <div className={`${styles.rlLibNodeLabel}${selected || hovered ? ` ${styles.rlLibNodeLabelHot}` : ''}`}>
          <strong>{topic.label}</strong>
          <span>{topic.docs.toLocaleString()} docs</span>
        </div>
      </Html>
    </group>
  );
}

function LinkLines({ topics }: { topics: CommunalTopic[] }) {
  const segments = useMemo(() => {
    const byId = new Map(topics.map((t) => [t.id, t]));
    const lines: [number, number, number][][] = [];
    const seen = new Set<string>();
    for (const t of topics) {
      for (const lid of t.links) {
        const other = byId.get(lid);
        if (!other) continue;
        const key = [t.id, lid].sort().join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push([t.position, other.position]);
      }
    }
    return lines;
  }, [topics]);

  return (
    <group>
      {segments.map((pts, i) => (
        <Line key={i} points={pts} color="#f59e0b" transparent opacity={0.32} lineWidth={1} />
      ))}
    </group>
  );
}

function Scene({ selectedId, onSelect }: Props) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.05;
  });

  return (
    <>
      <color attach="background" args={['#050810']} />
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 8, 4]} intensity={1.4} color="#fbbf24" />
      <pointLight position={[-6, -4, -3]} intensity={0.7} color="#22d3ee" />
      <Stars radius={60} depth={40} count={1800} factor={3} saturation={0} fade speed={0.6} />
      <group ref={group}>
        <LinkLines topics={COMMUNAL_TOPICS} />
        {COMMUNAL_TOPICS.map((t) => (
          <TopicNode
            key={t.id}
            topic={t}
            selected={selectedId === t.id}
            onSelect={onSelect}
          />
        ))}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.2} />
        </mesh>
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={14}
        autoRotate={false}
        rotateSpeed={0.7}
      />
    </>
  );
}

export default function CommunalKnowledgeMap({ selectedId, onSelect }: Props) {
  return (
    <div className={styles.rlLibCanvasWrap}>
      <Canvas camera={{ position: [0, 1.5, 9], fov: 48 }} dpr={[1, 1.75]}>
        <Suspense fallback={null}>
          <Scene selectedId={selectedId} onSelect={onSelect} />
        </Suspense>
      </Canvas>
      <p className={styles.rlLibCanvasHint}>Drag to rotate · Scroll to zoom · Click a node</p>
    </div>
  );
}
