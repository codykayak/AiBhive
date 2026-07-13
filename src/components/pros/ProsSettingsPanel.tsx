import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Loader2, MapPinned, Shield } from 'lucide-react';
import { prosPatchSettings, type ProsCompanySettings } from '../../lib/prosApi';
import { prosAdmin as t } from './prosAdminTheme';

type Props = {
  user: User;
  settings: ProsCompanySettings;
  companyName: string;
  tradeType: string;
  timezone?: string;
  onUpdated: (settings: ProsCompanySettings) => void;
};

export default function ProsSettingsPanel({
  user,
  settings,
  companyName,
  tradeType,
  timezone,
  onUpdated,
}: Props) {
  const [tracking, setTracking] = useState(settings.locationTrackingEnabled);
  const [pingMinutes, setPingMinutes] = useState(settings.locationPingIntervalMinutes);
  const [requirePhotos, setRequirePhotos] = useState(settings.requireJobPhotos);
  const [demoPreview, setDemoPreview] = useState(settings.demoPreviewEnabled !== false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await prosPatchSettings(user, {
        locationTrackingEnabled: tracking,
        locationPingIntervalMinutes: pingMinutes,
        requireJobPhotos: requirePhotos,
        demoPreviewEnabled: demoPreview,
      });
      onUpdated(res.settings);
      setMessage('Settings saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className={`${t.card} p-5 space-y-3`}>
        <h2 className="font-bold">Company</h2>
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">{companyName}</strong> · {tradeType}
          {timezone ? ` · ${timezone}` : ''}
        </p>
        <p className="text-sm text-slate-500">
          Field app: <strong className="text-slate-700">AiBhive Diagnose</strong>. Techs sync jobs, notes, photos,
          and knowledge feedback from the truck.
        </p>
      </div>

      <div className={`${t.calloutSky} p-5 space-y-4`}>
        <h2 className="font-bold flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-sky-600" />
          Location tracking
        </h2>
        <p className="text-sm text-slate-600">
          When enabled, tech devices send a GPS check-in on a schedule — not every second. App permissions will be
          handled in Diagnose; this toggle controls whether pings are accepted server-side.
        </p>

        <label className={t.checkboxRow}>
          <div>
            <div className="font-semibold text-sm">Enable periodic tracking</div>
            <div className="text-xs text-slate-500">Shows techs on Where is everybody?</div>
          </div>
          <input
            type="checkbox"
            checked={tracking}
            onChange={(e) => setTracking(e.target.checked)}
            className="w-5 h-5 accent-amber-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Ping interval (minutes)</span>
          <select
            value={pingMinutes}
            onChange={(e) => setPingMinutes(Number(e.target.value))}
            className={`w-full ${t.input}`}
          >
            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                Every {m} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`${t.card} p-5 space-y-4`}>
        <h2 className="font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Job policies
        </h2>
        <label className={t.checkboxRow}>
          <div>
            <div className="font-semibold text-sm">Require job photos</div>
            <div className="text-xs text-slate-500">Encourage photo proof before closing jobs</div>
          </div>
          <input
            type="checkbox"
            checked={requirePhotos}
            onChange={(e) => setRequirePhotos(e.target.checked)}
            className="w-5 h-5 accent-amber-500"
          />
        </label>
        <label className={t.checkboxRow}>
          <div>
            <div className="font-semibold text-sm">Show sample shop preview</div>
            <div className="text-xs text-slate-500">
              Fills empty tabs with example jobs, parts, and knowledge stats until you have real activity
            </div>
          </div>
          <input
            type="checkbox"
            checked={demoPreview}
            onChange={(e) => setDemoPreview(e.target.checked)}
            className="w-5 h-5 accent-amber-500"
          />
        </label>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 ${t.btnPrimary}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save settings
      </button>
    </div>
  );
}
