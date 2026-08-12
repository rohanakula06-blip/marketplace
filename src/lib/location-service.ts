'use client';

import { getCurrentPositionAsync, refinePosition, reverseGeocode } from '@/lib/geolocation';
import { resolveLocationLabel } from '@/lib/location-utils';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { api } from '@/lib/api';
import type { GeoCoords, GeoLocation } from '@/lib/geolocation';

let inflight: Promise<GeoLocation | null> | null = null;
let inflightGeneration = 0;
let stopRefine: (() => void) | null = null;

export function resetLocationState() {
  stopRefine?.();
  stopRefine = null;
  useUIStore.getState().resetLocation();
}

async function applyGpsToStore(pos: GeoCoords, generation: number, withLabel = true) {
  if (generation !== inflightGeneration) return;

  const store = useUIStore.getState();
  const tempLabel = `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
  store.applyGpsLocation(pos.lat, pos.lng, tempLabel, pos.accuracy ?? null);

  if (!withLabel) return;

  const geocoded = await reverseGeocode(pos.lat, pos.lng, pos.accuracy);
  if (generation !== inflightGeneration) return;

  const label = resolveLocationLabel(pos.lat, pos.lng, geocoded, pos.accuracy);
  store.applyGpsLocation(pos.lat, pos.lng, label, pos.accuracy ?? null);

  const user = useAuthStore.getState().user;
  if (user) {
    api.location
      .update({ location: label, latitude: pos.lat, longitude: pos.lng })
      .catch(() => {});
  }
}

export async function requestLiveLocation(options?: {
  quiet?: boolean;
  force?: boolean;
}): Promise<GeoLocation | null> {
  const { quiet = true, force = true } = options ?? {};
  const generation = ++inflightGeneration;

  if (inflight && !force) return inflight;

  stopRefine?.();
  stopRefine = null;

  const run = async (): Promise<GeoLocation | null> => {
    const store = useUIStore.getState();
    if (force) store.resetLocation();
    store.setLocationDetecting(true);
    store.setLocationError(null);

    try {
      const pos = await getCurrentPositionAsync();
      if (generation !== inflightGeneration) return null;

      // Sync pin on map; geocoded label loads in background
      void applyGpsToStore(pos, generation);
      store.setLocationDetecting(false);

      const label = useUIStore.getState().location;
      const resolved: GeoLocation = {
        lat: pos.lat,
        lng: pos.lng,
        label,
        accuracy: pos.accuracy,
      };

      if (!quiet) {
        store.showToast(`Location detected: ${label}`, 'success');
      }

      // Background refinement — pin moves when GPS improves (no extra wait for user)
      stopRefine = refinePosition(pos, (better) => {
        applyGpsToStore(better, generation).catch(() => {});
      }, 10000);

      return resolved;
    } catch (err) {
      if (generation !== inflightGeneration) return null;
      const msg = err instanceof Error ? err.message : 'Unable to get your location';
      store.setLocationError(msg);
      if (!quiet) {
        store.showToast(msg, 'error');
      }
      return null;
    } finally {
      if (generation === inflightGeneration) {
        store.setLocationDetecting(false);
        inflight = null;
      }
    }
  };

  inflight = run();
  return inflight;
}

/** Session-only search fallback — never persisted. */
export function applySessionSearchLocation(label: string, lat: number, lng: number) {
  stopRefine?.();
  stopRefine = null;
  const store = useUIStore.getState();
  store.setCoords(lat, lng, label, null, 'search');
  store.setLocationError(null);
}
