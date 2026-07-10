import { useMemo } from 'react';
import { FableApiContext } from '../../fable-scrape/fableApiContext';
import { FableWorkflowBridgeProvider } from '../../fable-scrape/fableWorkflowBridge';
import FableScrape from '../../fable-scrape/FableScrape';
import { meteredFableApi } from '../../fable-scrape/shared';
import { useResearchLabUser } from '../context/ResearchLabUserContext';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

/** Embeds Fable Scrape with Research Lab auth, metering, and project continuity. */
export default function OwrFableScrape() {
  const user = useResearchLabUser();
  const wf = useOwrWorkflow();
  const api = useMemo(
    () =>
      meteredFableApi(async () => ({
        Authorization: `Bearer ${await user!.getIdToken()}`,
      })),
    [user],
  );

  const bridge = useMemo(
    () =>
      user
        ? {
            projectId: wf.projectId,
            visibility: wf.visibility,
            setScrapeText: wf.setScrapeText,
            setOcrText: wf.setOcrText,
            setImageUrls: wf.setImageUrls,
            appendOutput: wf.appendOutput,
            addReceipt: wf.addReceipt,
            addReliability: wf.addReliability,
            authHeaders: wf.authHeaders,
          }
        : null,
    [
      user,
      wf.projectId,
      wf.visibility,
      wf.setScrapeText,
      wf.setOcrText,
      wf.setImageUrls,
      wf.appendOutput,
      wf.addReceipt,
      wf.addReliability,
      wf.authHeaders,
    ],
  );

  if (!user) return null;

  return (
    <FableApiContext.Provider value={api}>
      <FableWorkflowBridgeProvider value={bridge}>
        <div className={styles.owrFableEmbed}>
          <FableScrape embedded />
        </div>
      </FableWorkflowBridgeProvider>
    </FableApiContext.Provider>
  );
}
