import { useCallback } from 'react';
import styles from '../tartar.module.css';

const CUSTOMIZE_PROMPT =
  'Customize Old Tartar Research for me: change anomaly detection rules, add new archive sources, adjust entity extraction, and tailor the research workflow.';

export default function TartarCustomizeFab() {
  const openBuilder = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('bhive:open-assistant', {
        detail: {
          prefill: CUSTOMIZE_PROMPT,
          label: 'Customize Old Tartar Research',
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
