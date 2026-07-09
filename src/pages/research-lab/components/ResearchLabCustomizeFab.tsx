import { useCallback } from 'react';
import styles from '../../../old-tartar-research/tartar.module.css';

const CUSTOMIZE_PROMPT =
  'Customize Research Lab for me: add new research tools, tweak OCR and translation workflows, connect archive sources, and tailor the community library for my research goals.';

export default function ResearchLabCustomizeFab() {
  const openBuilder = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('bhive:open-assistant', {
        detail: {
          prefill: CUSTOMIZE_PROMPT,
          label: 'Customize Research Lab',
        },
      }),
    );
  }, []);

  return (
    <button
      type="button"
      className={styles.customizeFab}
      onClick={openBuilder}
      aria-label="Customize this app with Bhive Builder"
    >
      <span className={styles.customizeFabIcon}>✦</span>
      Customize this app
    </button>
  );
}
