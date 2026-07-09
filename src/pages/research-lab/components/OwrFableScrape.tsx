import { useMemo } from 'react';
import { FableApiContext } from '../../fable-scrape/fableApiContext';
import FableScrape from '../../fable-scrape/FableScrape';
import { meteredFableApi } from '../../fable-scrape/shared';
import { useResearchLabUser } from '../context/ResearchLabUserContext';
import styles from '../researchLab.module.css';

/** Embeds Fable Scrape with Research Lab auth + metering. */
export default function OwrFableScrape() {
  const user = useResearchLabUser();
  const api = useMemo(
    () =>
      meteredFableApi(async () => ({
        Authorization: `Bearer ${await user!.getIdToken()}`,
      })),
    [user],
  );

  if (!user) return null;

  return (
    <FableApiContext.Provider value={api}>
      <div className={styles.owrFableEmbed}>
        <FableScrape embedded />
      </div>
    </FableApiContext.Provider>
  );
}
