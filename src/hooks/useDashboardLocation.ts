'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation } from '@/lib/location-service';

export function useDashboardLocation() {
  const { coords, location, locationReady } = useUIStore();
  const authReady = useAuthStore((s) => s.authReady);
  const isDetecting = useUIStore((s) => s.locationDetecting);
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const syncCurrentLocation = useCallback(async (quiet = false) => {
    setSyncing(true);
    try {
      return await requestLiveLocation({ quiet, force: true });
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setInitialized(true);
  }, [authReady]);

  return {
    coords: { lat: coords.lat, lng: coords.lng },
    location,
    locationReady,
    syncing: syncing || isDetecting,
    initialized,
    syncCurrentLocation,
  };
}
