'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { useGeolocation, resolveLocationFromGps } from '@/lib/geolocation';
import { api } from '@/lib/api';

export function useDashboardLocation() {
  const { coords, location, setCoords, showToast, locationLocked, setLocationLocked } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const updateUser = useAuthStore((s) => s.setUser);
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const syncCurrentLocation = useCallback(
    async (quiet = false) => {
      setSyncing(true);
      try {
        const pos = await getCurrentPosition();
        const resolved = await resolveLocationFromGps(pos);
        setCoords(resolved.lat, resolved.lng, resolved.label, resolved.accuracy ?? null, 'gps');
        setLocationLocked(false);

        if (user) {
          try {
            await api.location.update({
              location: resolved.label,
              latitude: resolved.lat,
              longitude: resolved.lng,
            });
            updateUser({ ...user, location: resolved.label });
          } catch {
            if (!quiet) showToast('Location updated on this device', 'info');
          }
        }

        if (!quiet) showToast(`Using your location: ${resolved.label}`, 'success');
        return resolved;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not detect location';
        if (!quiet) showToast(message, 'error');
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [getCurrentPosition, setCoords, user, updateUser, showToast]
  );

  useEffect(() => {
    if (!authReady) return;
    setInitialized(true);
  }, [authReady]);

  return {
    coords: { lat: coords.lat, lng: coords.lng },
    location,
    syncing: syncing || geoLoading,
    initialized,
    syncCurrentLocation,
  };
}
