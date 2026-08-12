'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useUIStore } from '@/store/app-store';
import { formatAccuracy } from '@/lib/location-utils';
import type { MapMarker } from './MapView';
import { cn } from '@/lib/utils';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
});

export interface LocationMapSectionProps {
  markers?: MapMarker[];
  searchRadiusKm?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (id: string) => void;
  footer?: React.ReactNode;
  compact?: boolean;
}

export function LocationMapSection({
  markers = [],
  searchRadiusKm = 15,
  height = '420px',
  className,
  onMarkerClick,
  footer,
  compact = false,
}: LocationMapSectionProps) {
  const { coords, location, accuracy, status, error, refresh, isDetecting, locationLocked, locationSource } =
    useCurrentLocation({ autoDetect: false });
  const setLocationLocked = useUIStore((s) => s.setLocationLocked);

  const useGps = () => {
    setLocationLocked(false);
    refresh();
  };

  const accuracyLabel = formatAccuracy(accuracy ?? undefined);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3',
          status === 'error' ? 'border-red-200' : 'border-slate-200'
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              isDetecting ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'
            )}
          >
            {isDetecting ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {isDetecting ? 'Detecting your location…' : 'Your current location'}
            </p>
            <p className="font-semibold text-slate-900 truncate">{location}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              {accuracyLabel ? ` · ${accuracyLabel}` : ''}
              {locationLocked ? ' · manually set' : locationSource === 'gps' ? ' · GPS' : ' · waiting for GPS…'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={useGps}
          disabled={isDetecting}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 shrink-0"
        >
          {isDetecting ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {compact ? 'Refresh' : 'Use my location'}
        </button>
      </div>

      {locationLocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Location was set manually. Tap <strong>Use my location</strong> to switch back to live GPS.
        </div>
      )}

      {locationSource !== 'gps' && !isDetecting && !locationLocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Map may show a saved/default spot. Tap <strong>Use my location</strong> and allow browser location access.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-2 font-semibold underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {isDetecting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              Getting GPS coordinates…
            </div>
          </div>
        )}
        <MapView
          center={[coords.lat, coords.lng]}
          markers={markers}
          searchRadiusKm={searchRadiusKm}
          accuracyMeters={accuracy}
          height={height}
          onMarkerClick={onMarkerClick}
          onRecenter={useGps}
          recentering={isDetecting}
          animateCenter={status !== 'idle'}
        />
      </div>

      {footer}
    </div>
  );
}
