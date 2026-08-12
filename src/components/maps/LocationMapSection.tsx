'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation } from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { formatAccuracy } from '@/lib/location-utils';
import type { MapMarker } from './MapView';
import { cn } from '@/lib/utils';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] rounded-2xl bg-slate-100 animate-pulse" />
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
  const { coords, location, accuracy, useGps, locationReady } = useCurrentLocation();

  const accuracyLabel = formatAccuracy(accuracy ?? undefined);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <MapPin size={18} />
          </div>
          <div className="min-w-0">
            {locationReady ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your location</p>
                <p className="font-semibold text-slate-900 truncate">{location}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  {accuracyLabel ? ` · ${accuracyLabel}` : ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => useGps()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shrink-0"
        >
          <Navigation size={16} />
          {compact ? 'Refresh' : 'Use my location'}
        </button>
      </div>

      <div className="relative">
        {locationReady ? (
          <MapView
            center={[coords.lat, coords.lng]}
            markers={markers}
            searchRadiusKm={searchRadiusKm}
            accuracyMeters={accuracy}
            height={height}
            onMarkerClick={onMarkerClick}
            onRecenter={() => useGps()}
            animateCenter
          />
        ) : (
          <div className="rounded-2xl bg-slate-100 animate-pulse" style={{ height }} />
        )}
      </div>

      {footer}
    </div>
  );
}
