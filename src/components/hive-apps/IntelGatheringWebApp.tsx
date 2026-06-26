import IntelGathering from '../../pages/intel-gathering/IntelGathering';

type Props = { expanded?: boolean };

/** Intel Gathering page embedded in the Hive Apps store — DBPR + Firecrawl deep scan. */
export default function IntelGatheringWebApp({ expanded }: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 overflow-hidden bg-[#070a0f] ${
        expanded ? '' : 'max-h-[520px] overflow-y-auto'
      }`}
    >
      <IntelGathering embedded />
    </div>
  );
}
