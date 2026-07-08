import OldTartarResearch from '../../old-tartar-research';

/** Historical anomaly detection — archive ingestion, entity mentions, BYOK or Hive credits. */
export default function OldTartarResearchWebApp({ expanded }: { expanded?: boolean }) {
  return (
    <div className={expanded ? '' : 'px-4 sm:px-6 lg:px-8 py-6'}>
      <OldTartarResearch />
    </div>
  );
}
