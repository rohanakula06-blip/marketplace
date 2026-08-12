'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { useGeolocation, reverseGeocode } from '@/lib/geolocation';
import { DEMO_COORDS } from '@/lib/constants';
import { api } from '@/lib/api';

export function useDashboardLocation() {
  const { coords, location, setCoords, showToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.setUser);
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const syncCurrentLocation = useCallback(async (quiet = false) => {
    setSyncing(true);
    try {
      const pos = await getCurrentPosition();
      const label = await reverseGeocode(pos.lat, pos.lng);
      setCoords(pos.lat, pos.lng, label);

      if (user) {
        try {
          await api.location.update({ location: label, latitude: pos.lat, longitude: pos.lng });
          updateUser({ ...user, location: label });
        } catch {
          if (!quiet) showToast('Location updated locally; sync to account failed', 'error');
        }
      }

      if (!quiet) showToast(`Using your location: ${label}`, 'success');
      return { lat: pos.lat, lng: pos.lng, label };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not detect location';
      if (!quiet) showToast(message, 'error');
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [getCurrentPosition, setCoords, user, updateUser, showToast]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Don't block dashboard on GPS — load with default coords, refine in background.
      if (!cancelled) setInitialized(true);

      try {
        await syncCurrentLocation(true);
      } catch {
        if (!cancelled && coords.lat === DEMO_COORDS.lat && coords.lng === DEMO_COORDS.lng && user?.location) {
          setCoords(
            (user as { latitude?: number }).latitude ?? DEMO_COORDS.lat,
            (user as { longitude?: number }).longitude ?? DEMO_COORDS.lng,
            user.location
          );
        }
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on dashboard mount
  }, []);

  const activeCoords = {
    lat: coords.lat,
    lng: coords.lng,
  };

  return {
    coords: activeCoords,
    location,
    syncing: syncing || geoLoading,
    initialized,
    syncCurrentLocation,
  };
}
