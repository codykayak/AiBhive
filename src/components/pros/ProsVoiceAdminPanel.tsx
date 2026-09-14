import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CalendarCheck,
  Loader2,
  MessageSquare,
  Moon,
  PhoneIncoming,
  Radio,
  Save,
  Siren,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { prosPatchSettings, type ProsCompanySettings } from '../../lib/prosApi';
import { openProsVoicePanel } from '../../lib/prosVoiceEvents';
import { PROS_TRADE_PLAYBOOKS } from '../../lib/prosPlaybook';
import { prosAdmin as t } from './prosAdminTheme';
import ProsVoiceFlowInfographic from './ProsVoiceFlowInfographic';

export type ProsVoiceConfig = {
  greeting: string;
  trainingNotes: string;
  missedCallSms: string;
  afterHoursEnabled: boolean;
  afterHoursEscalationPhone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  overflowMode: 'always' | 'after_hours' | 'when_busy';
  emphasizeTrades: string[];
  appointmentWindowDays: number;
};

export const DEFAULT_VOICE_CONFIG: ProsVoiceConfig = {
  greeting:
    'Thanks for calling — this is AiBhive Voice. I can help schedule service, capture your issue, or connect urgent after-hours calls.',
  trainingNotes:
    'Emphasize trade playbooks from the knowledge base. Always capture name, address, symptom, and urgency. Offer morning callback for non-emergencies.',
  missedCallSms:
    'Sorry we missed you — reply with your address and issue, or call back anytime. AiBhive Voice can also book your visit.',
  afterHoursEnabled: true,
  afterHoursEscalationPhone: '',
  businessHoursStart: '08:00',
  businessHoursEnd: '17:00',
  overflowMode: 'after_hours',
  emphasizeTrades: ['hvac', 'plumbing', 'pool'],
  appointmentWindowDays: 5,
};

type Props = {
  user: User;
  settings: ProsCompanySettings;
  isManager: boolean;
  onUpdated: (settings: ProsCompanySettings) => void;
};

function readVoiceConfig(settings: ProsCompanySettings): ProsVoiceConfig {
  const raw = (settings as ProsCompanySettings & { voiceConfig?: Partial<ProsVoiceConfig> }).voiceConfig;
  return { ...DEFAULT_VOICE_CONFIG, ...raw };
}

export default function ProsVoiceAdminPanel({ user, settings, isManager, onUpdated }: Props) {
  const [config, setConfig] = useState<ProsVoiceConfig>(() => readVoiceConfig(settings));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setConfig(readVoiceConfig(settings));
  }, [settings]);

  const save = async () => {
    if (!isManager) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await prosPatchSettings(user, { voiceConfig: config } as Partial<ProsCompanySettings>);
      onUpdated(res.settings);
      setMessage('Voice settings saved — training notes apply on the next session.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleTrade = (slug: string) => {
    setConfig((prev) => {
      const has = prev.emphasizeTrades.includes(slug);
      return {
        ...prev,
        emphasizeTrades: has
          ? prev.emphasizeTrades.filter((s) => s !== slug)
          : [...prev.emphasizeTrades, slug],
      };
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className={`${t.highlightBanner} p-5 flex flex-wrap gap-4 items-center justify-between`}>
        <div className="flex items-start gap-3">
          <Radio className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-lg">AiBhive Voice control center</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Train what the voice agent prioritizes: missed-call responses, appointments, after-hours escalation, and
              trade playbooks. Same agent powers Talk on the marketing site and your shop line.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openProsVoicePanel({ startCall: true })} className={`px-4 py-2 text-sm ${t.btnPrimary}`}>
            Try Ai Voice
          </button>
          <Link to="/pros#voice" className={`px-4 py-2 text-sm ${t.btnSecondary}`}>
            Public voice section
          </Link>
        </div>
      </div>

      <ProsVoiceFlowInfographic />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`${t.card} p-5 space-y-4`}>
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Voice training
          </h3>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Greeting</span>
            <textarea
              className={`${t.textarea} w-full mt-1 min-h-[72px]`}
              value={config.greeting}
              disabled={!isManager}
              onChange={(e) => setConfig((p) => ({ ...p, greeting: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Training notes for the agent</span>
            <textarea
              className={`${t.textarea} w-full mt-1 min-h-[96px]`}
              value={config.trainingNotes}
              disabled={!isManager}
              onChange={(e) => setConfig((p) => ({ ...p, trainingNotes: e.target.value }))}
            />
          </label>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Emphasize trade playbooks</div>
            <div className="flex flex-wrap gap-2">
              {PROS_TRADE_PLAYBOOKS.map((trade) => (
                <button
                  key={trade.slug}
                  type="button"
                  disabled={!isManager}
                  onClick={() => toggleTrade(trade.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    config.emphasizeTrades.includes(trade.slug)
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {trade.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <h3 className="font-bold flex items-center gap-2">
            <PhoneIncoming className="w-5 h-5 text-sky-600" />
            Missed calls and responses
          </h3>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Auto-text after missed call</span>
            <textarea
              className={`${t.textarea} w-full mt-1 min-h-[72px]`}
              value={config.missedCallSms}
              disabled={!isManager}
              onChange={(e) => setConfig((p) => ({ ...p, missedCallSms: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">When to answer</span>
            <select
              className={`${t.input} w-full mt-1`}
              value={config.overflowMode}
              disabled={!isManager}
              onChange={(e) =>
                setConfig((p) => ({ ...p, overflowMode: e.target.value as ProsVoiceConfig['overflowMode'] }))
              }
            >
              <option value="always">Always — full overflow line</option>
              <option value="after_hours">After hours only</option>
              <option value="when_busy">When team is marked busy</option>
            </select>
          </label>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <h3 className="font-bold flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Appointments voice can set
          </h3>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Booking window (days ahead)</span>
            <input
              type="number"
              min={1}
              max={14}
              className={`${t.input} w-full mt-1`}
              value={config.appointmentWindowDays}
              disabled={!isManager}
              onChange={(e) =>
                setConfig((p) => ({ ...p, appointmentWindowDays: Number(e.target.value) || 5 }))
              }
            />
          </label>
          <p className="text-sm text-slate-600">
            Voice captures preferred day/time, trade, and symptom — then creates a queued job or callback task in Pros
            HQ for your dispatch board.
          </p>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <h3 className="font-bold flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            After-hours escalation
          </h3>
          <label className={t.checkboxRow}>
            <div>
              <div className="font-semibold text-sm">Enable after-hours triage</div>
              <div className="text-xs text-slate-500">Gas, flood, no heat in freezing weather, etc.</div>
            </div>
            <input
              type="checkbox"
              checked={config.afterHoursEnabled}
              disabled={!isManager}
              onChange={(e) => setConfig((p) => ({ ...p, afterHoursEnabled: e.target.checked }))}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-semibold text-slate-700">Business opens</span>
              <input
                type="time"
                className={`${t.input} w-full mt-1`}
                value={config.businessHoursStart}
                disabled={!isManager}
                onChange={(e) => setConfig((p) => ({ ...p, businessHoursStart: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-700">Business closes</span>
              <input
                type="time"
                className={`${t.input} w-full mt-1`}
                value={config.businessHoursEnd}
                disabled={!isManager}
                onChange={(e) => setConfig((p) => ({ ...p, businessHoursEnd: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Siren className="w-4 h-4" /> On-call escalation phone
            </span>
            <input
              type="tel"
              className={`${t.input} w-full mt-1`}
              placeholder="(555) 555-0100"
              value={config.afterHoursEscalationPhone}
              disabled={!isManager}
              onChange={(e) => setConfig((p) => ({ ...p, afterHoursEscalationPhone: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className={`${t.cardInset} p-5 space-y-3`}>
        <h3 className="font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-600" />
          More tools coming from voice
        </h3>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li>Callback list synced to Notify tab</li>
          <li>Voicemail transcript → job draft</li>
          <li>Repeat-caller recognition and service history</li>
          <li>Bilingual intake and SMS follow-up</li>
        </ul>
      </div>

      {isManager ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={busy} className={`inline-flex items-center gap-2 px-5 py-2.5 ${t.btnPrimary}`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save voice settings
          </button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Managers can edit voice training and escalation rules.</p>
      )}
    </div>
  );
}
