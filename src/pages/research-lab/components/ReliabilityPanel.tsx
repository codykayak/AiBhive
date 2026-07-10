import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

export default function ReliabilityPanel() {
  const { reliability } = useOwrWorkflow();
  if (!reliability.length) return null;

  return (
    <section className={styles.rlReliability} aria-label="Archive reliability log">
      <h3 className={styles.rlReliabilityTitle}>Archive reliability</h3>
      <p className={styles.rlReliabilityLead}>
        Engine routing, retries, and blocked reasons for this session — so you can see what the archive
        stack actually did.
      </p>
      <ul className={styles.rlReliabilityList}>
        {[...reliability]
          .reverse()
          .slice(0, 12)
          .map((ev) => (
            <li
              key={ev.id}
              className={`${styles.rlReliabilityItem}${ev.ok ? '' : ` ${styles.rlReliabilityItemFail}`}`}
            >
              <span className={styles.rlReliabilityTime}>
                {new Date(ev.at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={styles.rlReliabilityMsg}>
                {ev.ok ? 'OK' : 'Fail'} · {ev.op}
                {ev.engine ? ` · ${ev.engine}` : ''}
                {ev.routingMode ? ` · ${ev.routingMode}` : ''}
                {typeof ev.retries === 'number' && ev.retries > 0 ? ` · ${ev.retries} retries` : ''}
              </span>
              {(ev.reason || (ev.pagesVisited != null && ev.pagesVisited > 0)) && (
                <span className={styles.rlReliabilityDetail}>
                  {ev.reason || ''}
                  {ev.pagesVisited != null ? ` · ${ev.pagesVisited} pages` : ''}
                </span>
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}
