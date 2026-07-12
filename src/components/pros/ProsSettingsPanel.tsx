import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Loader2, MapPinned, Shield } from 'lucide-react';
import { prosPatchSettings, type ProsCompanySettings } from '../../lib/prosApi';

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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="font-bold">Company</h2>
        <p className="text-sm text-slate-400">
          <strong className="text-white">{companyName}</strong> · {tradeType}
          {timezone ? ` · ${timezone}` : ''}
        </p>
        <p className="text-sm text-slate-500">
          Field app: <strong className="text-slate-300">AiBhive Diagnose</strong>. Techs sync jobs, notes, photos,
          and knowledge feedback from the truck.
        </p>
      </div>

      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-sky-400" />
          Location tracking
        </h2>
        <p className="text-sm text-slate-400">
          When enabled, tech devices send a GPS check-in on a schedule — not every second. App permissions will be
          handled in Diagnose; this toggle controls whether pings are accepted server-side.
        </p>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 cursor-pointer">
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
          <span className="text-sm font-semibold text-slate-300">Ping interval (minutes)</span>
          <select
            value={pingMinutes}
            onChange={(e) => setPingMinutes(Number(e.target.value))}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
          >
            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                Every {m} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Job policies
        </h2>
        <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 cursor-pointer">
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
      </div>

      {message ? <p className="text-sm text-slate-400">{message}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-black font-bold px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save settings
      </button>
    </div>
  );
}
