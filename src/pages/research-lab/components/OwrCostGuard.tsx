import styles from '../researchLab.module.css';

type Props = {
  estimatedUsd: number;
  onProceed: () => void;
  onNarrow: () => void;
  onCancel: () => void;
};

export default function OwrCostGuard({ estimatedUsd, onProceed, onNarrow, onCancel }: Props) {
  return (
    <div className={styles.owrModalBackdrop} role="dialog" aria-modal aria-labelledby="cost-guard-title">
      <div className={styles.owrModal}>
        <h3 id="cost-guard-title">Estimated cost over $5</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          This operation may use about <strong>${estimatedUsd.toFixed(2)}</strong> in Hive credits
          (processing + AI API). You can proceed, or narrow the batch to reduce cost.
        </p>
        <div className={styles.owrModalActions}>
          <button type="button" className={`${styles.owrBtn} ${styles.owrBtnPrimary}`} onClick={onProceed}>
            Proceed anyway
          </button>
          <button type="button" className={styles.owrBtn} onClick={onNarrow}>
            Narrow to 20 files
          </button>
          <button type="button" className={styles.owrBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
