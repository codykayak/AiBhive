import { useEffect, useState } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

type Pack = {
  id: string;
  name: string;
  blurb: string;
  topicId: string;
  category: string;
  estimateHint: string;
  suggestedUrl?: string;
  steps: Array<{ step: number; action: string; hint: string }>;
};

export default function DomainPackPicker() {
  const { domainPackId, setDomainPackId, setActiveStep, appendOutput } = useOwrWorkflow();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetch('/api/research-lab/domain-packs')
      .then((r) => r.json())
      .then((d) => setPacks(d.packs || []))
      .catch(() => setPacks([]));
  }, []);

  const active = packs.find((p) => p.id === domainPackId);

  function applyPack(pack: Pack) {
    setDomainPackId(pack.id);
    setActiveStep(pack.steps[0]?.step ?? 0);
    appendOutput({
      step: 'brief',
      title: `Domain pack · ${pack.name}`,
      text: `${pack.blurb}\n\nRecipe:\n${pack.steps.map((s, i) => `${i + 1}. [step ${s.step}] ${s.hint}`).join('\n')}\n\n${pack.estimateHint}${
        pack.suggestedUrl ? `\n\nSuggested start URL:\n${pack.suggestedUrl}` : ''
      }`,
    });
    setOpen(false);
  }

  return (
    <div className={styles.rlPackBar}>
      <button type="button" className={styles.rlPackToggle} onClick={() => setOpen((o) => !o)}>
        <Sparkles className="w-4 h-4" aria-hidden />
        {active ? `Pack: ${active.name}` : 'Domain packs — preset agent recipes'}
      </button>
      {open && (
        <div className={styles.rlPackGrid}>
          {packs.map((p) => (
            <article key={p.id} className={styles.rlPackCard}>
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
              <p className={styles.rlPackEst}>{p.estimateHint}</p>
              {p.suggestedUrl ? (
                <p className={styles.rlPackEst} style={{ wordBreak: 'break-all', opacity: 0.85 }}>
                  Start URL ready in recipe notes
                </p>
              ) : null}
              <button type="button" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} onClick={() => applyPack(p)}>
                <Play className="w-3.5 h-3.5 inline mr-1" />
                Run this recipe
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
