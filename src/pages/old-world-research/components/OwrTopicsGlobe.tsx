import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../oldWorldResearch.module.css';

export const RESEARCH_TOPICS = [
  { id: 'star-forts', label: 'Star Forts', angle: 0 },
  { id: 'orphan-trains', label: 'Orphan Trains', angle: 36 },
  { id: 'asylums', label: 'Insane Asylums', angle: 72 },
  { id: 'architecture', label: 'Architectural Documentation', angle: 108 },
  { id: 'world-fairs', label: 'World Fairs', angle: 144 },
  { id: 'fires', label: 'Massive Structural Fires', angle: 180 },
  { id: 'bridges', label: 'Bridges & Anomalies', angle: 216 },
  { id: 'mud-flood', label: 'Mud Flood Evidence', angle: 252 },
  { id: 'giants', label: 'Giant Trees & People', angle: 288 },
  { id: 'underground', label: 'Underground Systems', angle: 324 },
];

type Props = {
  wordCount: number;
  onTopicSelect?: (topicId: string) => void;
};

export default function OwrTopicsGlobe({ wordCount, onTopicSelect }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeTopic, setActiveTopic] = useState(RESEARCH_TOPICS[0].id);

  const onMove = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: ny * 14, y: nx * 18 });
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('touchmove', handleTouch, { passive: true });
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('touchmove', handleTouch);
    };
  }, [onMove]);

  const nodePositions = useMemo(() => {
    const r = 42;
    return RESEARCH_TOPICS.map((t) => {
      const rad = (t.angle * Math.PI) / 180;
      return {
        ...t,
        left: 50 + r * Math.cos(rad),
        top: 50 + r * Math.sin(rad) * 0.85,
      };
    });
  }, []);

  function selectTopic(id: string) {
    setActiveTopic(id);
    onTopicSelect?.(id);
    const label = RESEARCH_TOPICS.find((t) => t.id === id)?.label ?? 'Old World Research';
    window.dispatchEvent(
      new CustomEvent('bhive:open-assistant', {
        detail: {
          prefill: `Help me research ${label.toLowerCase()} — suggest Fable Scrape sources, OCR workflow, and RAG queries.`,
          label: 'Old World Research',
        },
      }),
    );
  }

  return (
    <section className={styles.owrTopics} aria-label="Research topics">
      <div className={styles.owrTopicsHeader}>
        <h2 className={styles.owrTopicsTitle}>Explore the old world</h2>
        <p className={styles.owrWordCount}>
          <strong>{wordCount.toLocaleString()}</strong> words OCR&apos;d &amp; indexed in the RAG library
        </p>
        <p className={styles.owrWordCountSub}>
          grows as researchers ingest and share archives
        </p>
      </div>

      <div className={styles.owrGlobeStage} ref={stageRef}>
        <div
          className={styles.owrGlobe}
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        />
        <svg className={styles.owrGlobeLines} viewBox="0 0 100 100" aria-hidden>
          {nodePositions.map((n) => (
            <line
              key={n.id}
              x1="50"
              y1="50"
              x2={n.left}
              y2={n.top}
              stroke="rgba(245,158,11,0.25)"
              strokeWidth="0.15"
            />
          ))}
        </svg>
        {nodePositions.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`${styles.owrTopicNode} ${activeTopic === n.id ? styles.owrTopicNodeActive : ''}`}
            style={{ left: `${n.left}%`, top: `${n.top}%` }}
            onClick={() => selectTopic(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>
    </section>
  );
}
