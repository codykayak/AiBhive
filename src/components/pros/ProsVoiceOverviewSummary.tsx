import { Link } from 'react-router-dom';
import { CalendarCheck, PhoneIncoming, Radio, Siren } from 'lucide-react';
import { prosAdmin as t } from './prosAdminTheme';
import { DemoSampleBadge } from './ProsDemoPreviewBanner';

export type ProsVoiceSummary = {
  callsToday: number;
  callsThisWeek: number;
  missedCallsHandled: number;
  appointmentsSet: number;
  afterHoursEscalations: number;
  avgHandleSec: number;
  recentCalls: Array<{
    id: string;
    caller: string;
    summary: string;
    outcome: 'appointment' | 'callback' | 'escalation' | 'info';
    createdAt: number | null;
    isDemo?: boolean;
  }>;
};

type Props = {
  summary: ProsVoiceSummary | null | undefined;
  demoPreview?: boolean;
};

const OUTCOME_LABEL: Record<string, string> = {
  appointment: 'Appointment set',
  callback: 'Callback queued',
  escalation: 'Escalated',
  info: 'Info captured',
};

function formatWhen(ts: number | null) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProsVoiceOverviewSummary({ summary, demoPreview }: Props) {
  if (!summary) return null;

  const cards = [
    { label: 'Calls today', value: summary.callsToday ?? 0, icon: PhoneIncoming },
    { label: 'This week', value: summary.callsThisWeek ?? 0, icon: Radio },
    { label: 'Appointments set', value: summary.appointmentsSet ?? 0, icon: CalendarCheck },
    { label: 'After-hours escalations', value: summary.afterHoursEscalations ?? 0, icon: Siren },
  ];

  return (
    <div className={`${t.calloutAmber} p-5 space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Radio className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg">AiBhive Voice</h2>
              {demoPreview ? <DemoSampleBadge /> : null}
            </div>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {summary.missedCallsHandled ?? 0} missed calls handled this week · avg {summary.avgHandleSec ?? 0}s per
              intake · Diagnose and dispatch stay in sync.
            </p>
          </div>
        </div>
        <Link to="/pros/app?tab=voice" className={`px-4 py-2 text-sm shrink-0 ${t.btnSecondary}`}>
          Voice settings
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${t.card} p-4`}>
            <card.icon className="w-4 h-4 text-amber-600 mb-2" />
            <div className="text-2xl font-black">{card.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {summary.recentCalls?.length ? (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recent voice activity</div>
          <ul className="space-y-2">
            {(summary.recentCalls || []).slice(0, 4).map((call) => (
              <li key={call.id} className={`${t.cardSubtle} px-4 py-3 text-sm flex flex-wrap gap-2 justify-between`}>
                <div>
                  <span className="font-semibold text-slate-800">{call.caller}</span>
                  <span className="text-slate-500"> · {call.summary}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-bold">
                    {OUTCOME_LABEL[call.outcome] || call.outcome}
                  </span>
                  {call.createdAt ? formatWhen(call.createdAt) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
