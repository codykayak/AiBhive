import { useMemo } from 'react';
import { MapPin, Navigation, Radio } from 'lucide-react';
import type { ProsTeamLocation } from '../../lib/prosApi';
import { cn } from '../../lib/utils';

type Props = {
  locations: ProsTeamLocation[];
  trackingEnabled: boolean;
  pingIntervalMinutes: number;
};

function formatAgo(ts: number | null) {
  if (!ts) return 'No ping yet';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export default function ProsWhereIsEverybody({ locations, trackingEnabled, pingIntervalMinutes }: Props) {
  const withCoords = locations.filter((l) => l.lat != null && l.lng != null);
  const bounds = useMemo(() => {
    if (!withCoords.length) return null;
    const lats = withCoords.map((l) => l.lat as number);
    const lngs = withCoords.map((l) => l.lng as number);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [withCoords]);

  const project = (lat: number, lng: number) => {
    if (!bounds) return { x: 50, y: 50 };
    const pad = 12;
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.02);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.02);
    const x = pad + ((lng - bounds.minLng) / lngSpan) * (100 - pad * 2);
    const y = pad + (1 - (lat - bounds.minLat) / latSpan) * (100 - pad * 2);
    return { x, y };
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-400" />
              Where is everybody?
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Periodic GPS check-ins from the field app — not live streaming. Techs ping every{' '}
              <strong className="text-slate-200">{pingIntervalMinutes} minutes</strong> when tracking is enabled.
            </p>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
              trackingEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            {trackingEnabled ? 'Tracking on' : 'Tracking off'}
          </div>
        </div>

        <div className="relative aspect-[16/9] max-h-[360px] rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e3a8a]/40">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {!trackingEnabled ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-slate-400 max-w-md">
                Enable location tracking in Settings to see periodic tech check-ins on this map.
              </p>
            </div>
          ) : withCoords.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-slate-400 max-w-md">
                No location pings yet. Once techs open Diagnose with tracking enabled, pins will appear here.
              </p>
            </div>
          ) : (
            withCoords.map((loc) => {
              const { x, y } = project(loc.lat as number, loc.lng as number);
              return (
                <div
                  key={loc.uid}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  title={loc.displayName}
                >
                  <span
                    className={cn(
                      'block w-4 h-4 rounded-full border-2 border-white shadow-lg',
                      loc.stale ? 'bg-slate-500' : 'bg-amber-400'
                    )}
                  />
                  <span className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                    {loc.displayName.split(' ')[0]}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {locations.map((loc) => (
          <div
            key={loc.uid}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex gap-3 items-start"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                loc.stale ? 'bg-slate-700/40' : 'bg-amber-500/20'
              )}
            >
              <MapPin className={cn('w-5 h-5', loc.stale ? 'text-slate-400' : 'text-amber-300')} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{loc.displayName}</div>
              <div className="text-xs text-slate-500 truncate">{loc.email}</div>
              <div className="text-xs mt-2 text-slate-400">
                {loc.lat != null && loc.lng != null
                  ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                  : 'Waiting for first ping'}
              </div>
              <div className={cn('text-[11px] mt-1 font-semibold', loc.stale ? 'text-slate-500' : 'text-emerald-400')}>
                {formatAgo(loc.updatedAt)}
                {loc.stale && loc.updatedAt ? ' · stale' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
