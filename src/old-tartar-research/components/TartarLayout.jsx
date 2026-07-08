import styles from '../tartar.module.css';

export const TARTAR_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'research', label: 'Research' },
  { id: 'archives', label: 'Archives' },
  { id: 'settings', label: 'Settings' },
];

export default function TartarLayout({ children, activeTab, onTab, onSignOut, userEmail }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Old Tartar Research</div>
        {userEmail && (
          <p className={styles.sidebarUser} title={userEmail}>{userEmail}</p>
        )}
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
