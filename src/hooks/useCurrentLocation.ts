'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/store/app-store';
import { requestLiveLocation } from '@/lib/location-service';

export function useCurrentLocation() {
  const coords = useUIStore((s) => s.coords);
  const location = useUIStore((s) => s.location);
  const locationAccuracy = useUIStore((s) => s.locationAccuracy);
  const locationReady = useUIStore((s) => s.locationReady);
  const locationSource = useUIStore((s) => s.locationSource);
  const isDetecting = useUIStore((s) => s.locationDetecting);
  const error = useUIStore((s) => s.locationError);

  const refresh = useCallback(
    (quiet = true) => requestLiveLocation({ quiet, force: true }),
    []
  );

  const useGps = useCallback(() => requestLiveLocation({ quiet: false, force: true }), []);

  const status = isDetecting
    ? 'detecting'
    : error
      ? 'error'
      : locationReady
        ? 'ready'
        : 'pending';

  return {
    coords,
    location,
    accuracy: locationAccuracy,
    locationReady,
    status,
    error,
    refresh,
    useGps,
    isDetecting,
    locationSource,
  };
}
