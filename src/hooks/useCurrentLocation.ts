'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { getCurrentPositionAsync, resolveLocationFromGps } from '@/lib/geolocation';
import { api } from '@/lib/api';

export type LocationStatus = 'idle' | 'detecting' | 'ready' | 'error';

export function useCurrentLocation(options?: { autoDetect?: boolean }) {
  const autoDetect = options?.autoDetect ?? true;
  const {
    coords,
    location,
    locationAccuracy,
    locationLocked,
    setCoords,
    setLocationLocked,
    showToast,
  } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const detectStarted = useRef(false);

  const refresh = useCallback(
    async (quiet = false) => {
      setStatus('detecting');
      setError(null);
      try {
        const pos = await getCurrentPositionAsync();
        const resolved = await resolveLocationFromGps(pos);
        setCoords(resolved.lat, resolved.lng, resolved.label, resolved.accuracy ?? null);
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
    if (!autoDetect || locationLocked || detectStarted.current) return;
    detectStarted.current = true;
    refresh(true).catch(() => {});
  }, [autoDetect, locationLocked, refresh]);

  return {
    coords,
    location,
    accuracy: locationAccuracy,
    status,
    error,
    refresh,
    isDetecting: status === 'detecting',
    locationLocked,
  };
}
