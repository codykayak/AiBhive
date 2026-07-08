import { Link, useLocation } from 'react-router-dom';
import styles from '../tartar.module.css';

const NAV = [
  { to: '/apps', label: 'Apps' },
  { to: '/', label: 'Dashboard', end: true },
  { to: '/sources', label: 'Sources' },
  { to: '/mentions', label: 'Mentions' },
  { to: '/anomalies', label: 'Anomalies' },
  { to: '/search-terms', label: 'Search terms' },
  { to: '/build', label: 'My build' },
  { to: '/settings', label: 'Settings' },
];

export default function TartarLayout({ children, onSignOut }) {
  const { pathname } = useLocation();

  return (
    <div className={styles.tartar}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>Old Tartar Research</div>
          {NAV.map(({ to, label, end }) => {
            const active = end ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`${styles.navLink} ${active ? styles.navActive : ''}`}>
                {label}
              </Link>
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
    </div>
  );
}
