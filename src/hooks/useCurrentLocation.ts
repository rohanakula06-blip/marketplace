'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { getCurrentPositionAsync, resolveLocationFromGps } from '@/lib/geolocation';
import { api } from '@/lib/api';

export type LocationStatus = 'idle' | 'detecting' | 'ready' | 'error';

export function useCurrentLocation(options?: { autoDetect?: boolean; waitForAuth?: boolean }) {
  const autoDetect = options?.autoDetect ?? true;
  const waitForAuth = options?.waitForAuth ?? true;
  const {
    coords,
    location,
    locationAccuracy,
    locationLocked,
    locationSource,
    setCoords,
    setLocationLocked,
    showToast,
  } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authReady = useAuthStore((s) => s.authReady);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useUIStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const refresh = useCallback(
    async (quiet = false) => {
      const id = ++runId.current;
      setStatus('detecting');
      setError(null);
      try {
        const pos = await getCurrentPositionAsync();
        if (id !== runId.current) return null;

        const resolved = await resolveLocationFromGps(pos);
        if (id !== runId.current) return null;

        setCoords(resolved.lat, resolved.lng, resolved.label, resolved.accuracy ?? null, 'gps');
        setLocationLocked(false);

        if (user) {
          try {
            await api.location.update({
              location: resolved.label,
              latitude: resolved.lat,
              longitude: resolved.lng,
            });
            setUser({ ...user, location: resolved.label });
          } catch {
            /* saved on device */
          }
        }

        setStatus('ready');
        if (!quiet) showToast(`Using your location: ${resolved.label}`, 'success');
        return resolved;
      } catch (err) {
        if (id !== runId.current) return null;
        const msg = err instanceof Error ? err.message : 'Unable to get your location';
        setError(msg);
        setStatus('error');
        if (!quiet) showToast(msg, 'error');
        throw err;
      }
    },
    [setCoords, setLocationLocked, user, setUser, showToast]
  );

  useEffect(() => {
    if (!autoDetect || !hydrated) return;
    if (waitForAuth && !authReady) return;
    if (locationLocked || locationSource === 'manual') return;

    refresh(true).catch(() => {});
  }, [autoDetect, hydrated, waitForAuth, authReady, locationLocked, locationSource, refresh]);

  return {
    coords,
    location,
    accuracy: locationAccuracy,
    status,
    error,
    refresh,
    isDetecting: status === 'detecting',
    locationLocked,
    locationSource,
  };
}
