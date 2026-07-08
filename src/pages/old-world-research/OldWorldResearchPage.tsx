import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';
import { createTartarApi } from '../../old-tartar-research/lib/tartarApi';
import { SEO } from '../../components/SEO';
import OwrHero from './components/OwrHero';
import OwrTopicsGlobe from './components/OwrTopicsGlobe';
import OwrToolsHub from './components/OwrToolsHub';
import styles from './oldWorldResearch.module.css';

const BASE_WORD_COUNT = 128_450;

export default function OldWorldResearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wordCount, setWordCount] = useState(BASE_WORD_COUNT);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const api = createTartarApi(user);
    void api.getArchiveStats().then((stats) => {
      const userWords = (stats?.user?.mentionsExtracted ?? 0) * 180;
      const poolWords = (stats?.community?.documentsIndexed ?? 0) * 180;
      setWordCount(BASE_WORD_COUNT + userWords + poolWords);
    }).catch(() => {});
  }, [user]);

  return (
    <div className={styles.owr}>
      <SEO
        title="Old World Research — Help Build the Library | AiBhive"
        description="In-depth historical research: OCR, archives, RAG search, maps, anomalies. Hive credits power processing and AI. Star forts, world fairs, mud flood evidence, and more."
        keywords="old world research, Tartaria, historical archives, OCR, RAG, AiBhive, star forts, mud flood"
      />
      <OwrHero />
      <OwrTopicsGlobe wordCount={wordCount} />
      <OwrToolsHub />
    </div>
  );
}
