import styles from './Toolbar.module.css';

export default function Toolbar({ zoningVisible, onToggleZoning, loading, error }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke="#58a6ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="9 22 9 12 15 12 15 22"
            stroke="#58a6ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.title}>Eugene Zoning Map</span>
        <span className={styles.subtitle}>Lane County, OR</span>
      </div>

      <div className={styles.controls}>
        {error && (
          <span className={styles.error} title={error}>
            ⚠ Zoning load failed
          </span>
        )}
        {loading && !error && (
          <span className={styles.loading}>
            <span className={styles.spinner} />
            Loading zoning…
          </span>
        )}

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={zoningVisible}
            onChange={onToggleZoning}
            disabled={loading && !error}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
          <span className={styles.toggleLabel}>Zoning</span>
        </label>
      </div>
    </div>
  );
}
