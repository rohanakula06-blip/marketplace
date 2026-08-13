'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { formatAccuracy } from '@/lib/location-utils';
import type { MapMarker } from './MapView';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
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
  const { coords, location, accuracy, requestGps, locationReady, isDetecting, error } = useCurrentLocation();
  const { t } = useTranslation();

  const accuracyLabel = formatAccuracy(accuracy ?? undefined);
  const hasValidCoords =
    locationReady && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) && !(coords.lat === 0 && coords.lng === 0);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              hasValidCoords ? 'bg-green-100 text-green-700' : isDetecting ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            )}
          >
            {isDetecting ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </div>
          <div className="min-w-0">
            {hasValidCoords ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('location.yourLocation')}</p>
                <p className="font-semibold text-slate-900 truncate">{location}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  {accuracyLabel ? ` · ${accuracyLabel}` : ''}
                </p>
              </>
            ) : isDetecting ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('location.detecting')}</p>
                <p className="text-sm text-slate-600">{t('location.detectingHint')}</p>
              </>
            ) : error ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-red-500">{t('location.gpsUnavailable')}</p>
                <p className="text-sm text-slate-600">{error}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('location.locationLabel')}</p>
                <p className="text-sm text-slate-500">{t('location.locationHint')}</p>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => requestGps()}
          disabled={isDetecting}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shrink-0 disabled:opacity-60"
        >
          {isDetecting ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {compact ? t('location.refreshGps') : t('location.useMyLocation')}
        </button>
      </div>

      {error && !hasValidCoords && !isDetecting && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{t('location.searchCityWarning')}</span>
        </div>
      )}

      <div className="relative">
        {hasValidCoords ? (
          <MapView
            center={[coords.lat, coords.lng]}
            markers={markers}
            searchRadiusKm={searchRadiusKm}
            accuracyMeters={accuracy}
            height={height}
            onMarkerClick={onMarkerClick}
            onRecenter={() => requestGps()}
            recentering={isDetecting}
            animateCenter
          />
        ) : (
          <div
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 text-center px-6"
            style={{ height }}
          >
            {isDetecting ? (
              <>
                <Loader2 size={28} className="animate-spin text-blue-500" />
                <p className="text-sm text-slate-600">{t('location.pinpointing')}</p>
              </>
            ) : (
              <>
                <MapPin size={28} className="text-slate-400" />
                <p className="text-sm text-slate-600 max-w-xs">{t('location.mapPending')}</p>
                <button
                  type="button"
                  onClick={() => requestGps()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('location.useMyLocation')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}
