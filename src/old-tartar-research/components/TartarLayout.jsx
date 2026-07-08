import styles from '../tartar.module.css';

export const TARTAR_TABS = [
  { id: 'apps', label: 'Apps' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sources', label: 'Sources' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'search-terms', label: 'Search terms' },
  { id: 'build', label: 'My build' },
  { id: 'settings', label: 'Settings' },
];

export default function TartarLayout({ children, activeTab, onTab, onSignOut }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Old Tartar Research</div>
        {TARTAR_TABS.map(({ id, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`${styles.navLink} ${active ? styles.navActive : ''}`}
            >
              {label}
            </button>
          );
        })}
        {onSignOut && (
          <button type="button" className={styles.navLink} onClick={onSignOut} style={{ marginTop: 'auto' }}>
            Sign out
          </button>
        )}
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
