'use client';

import { getCurrentPositionAsync, resolveLocationFromGps } from '@/lib/geolocation';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { api } from '@/lib/api';
import type { GeoLocation } from '@/lib/geolocation';

let inflight: Promise<GeoLocation | null> | null = null;

export function resetLocationState() {
  useUIStore.getState().resetLocation();
}

export async function requestLiveLocation(options?: {
  quiet?: boolean;
  force?: boolean;
}): Promise<GeoLocation | null> {
  const { quiet = true, force = true } = options ?? {};

  if (inflight) return inflight;

  inflight = (async () => {
    const store = useUIStore.getState();
    if (force) store.resetLocation();
    store.setLocationDetecting(true);
    store.setLocationError(null);

    try {
      const pos = await getCurrentPositionAsync();
      const resolved = await resolveLocationFromGps(pos);

      store.applyGpsLocation(
        resolved.lat,
        resolved.lng,
        resolved.label,
        resolved.accuracy ?? null
      );

      const user = useAuthStore.getState().user;
      if (user) {
        try {
          await api.location.update({
            location: resolved.label,
            latitude: resolved.lat,
            longitude: resolved.lng,
          });
        } catch {
          /* session GPS is source of truth */
        }
      }

      if (!quiet) {
        store.showToast(`Location detected: ${resolved.label}`, 'success');
      }

      return resolved;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to get your location';
      if (!quiet) {
        store.setLocationError(msg);
        store.showToast(msg, 'error');
      }
      return null;
    } finally {
      store.setLocationDetecting(false);
      inflight = null;
    }
  })();

  return inflight;
}

/** Session-only search fallback — never persisted. */
export function applySessionSearchLocation(label: string, lat: number, lng: number) {
  const store = useUIStore.getState();
  store.setCoords(lat, lng, label, null, 'search');
}
