'use client';

import { useCallback, useState } from 'react';
import { resolveLocationLabel, POPULAR_CITIES } from '@/lib/location-utils';

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
  accuracy?: number;
}

const PRECISE_M = 65;
const GOOD_M = 150;

function isValidReading(c: GeoCoords): boolean {
  return (
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180 &&
    !(c.lat === 0 && c.lng === 0)
  );
}

function pickBest(a: GeoCoords | null, b: GeoCoords | null): GeoCoords | null {
  if (!a || !isValidReading(a)) return b && isValidReading(b) ? b : null;
  if (!b || !isValidReading(b)) return a;
  return (a.accuracy ?? Infinity) <= (b.accuracy ?? Infinity) ? a : b;
}

function getPosition(options: PositionOptions): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      options
    );
  });
}

async function tryGetPosition(options: PositionOptions): Promise<GeoCoords | null> {
  try {
    const reading = await getPosition(options);
    return isValidReading(reading) ? reading : null;
  } catch {
    return null;
  }
}

function watchForFix(
  timeoutMs: number,
  highAccuracy: boolean,
  goodEnoughM?: number
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    let best: GeoCoords | null = null;
    let watchId = -1;
    let settled = false;

    const cleanup = () => {
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
    };

    const finish = (result: GeoCoords) => {
      if (settled) return;
      settled = true;
      cleanup();
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      if (best && isValidReading(best)) finish(best);
      else {
        cleanup();
        if (!settled) reject(Object.assign(new Error('timeout'), { code: 3 }));
      }
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const reading: GeoCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        if (!isValidReading(reading)) return;
        best = pickBest(best, reading);
        if (goodEnoughM != null && (reading.accuracy ?? Infinity) <= goodEnoughM) {
          finish(reading);
        }
      },
      () => {},
      { enableHighAccuracy: highAccuracy, maximumAge: 0, timeout: timeoutMs }
    );
  });
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case 1:
      return 'Location permission denied. Click the lock icon in your browser address bar and allow location.';
    case 2:
      return 'Location unavailable. Enable Location in Windows Settings → Privacy, or search your city below.';
    case 3:
      return 'GPS timed out. Allow location permission, or search your city using the box above.';
    default:
      return 'Could not get location. Search your city or area instead.';
  }
}

/**
 * Tiered GPS: high-accuracy first, then network/Wi‑Fi fallback (works on Windows desktop).
 * Never fails if any valid coordinate source responds.
 */
export async function getCurrentPositionAsync(): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Location requires HTTPS or localhost');
  }

  const state: { best: GeoCoords | null } = { best: null };
  let lastError: GeolocationPositionError | null = null;

  const merge = (reading: GeoCoords | null) => {
    if (!reading || !isValidReading(reading)) return;
    const current = state.best;
    if (!current || (reading.accuracy ?? Infinity) < (current.accuracy ?? Infinity)) {
      state.best = reading;
    }
  };

  // ── Tier 1: parallel fast sources ──────────────────────────────────────
  const [freshHigh, cachedHigh, freshLow, cachedLow] = await Promise.all([
    tryGetPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }),
    tryGetPosition({ enableHighAccuracy: true, maximumAge: 60000, timeout: 4000 }),
    tryGetPosition({ enableHighAccuracy: false, maximumAge: 0, timeout: 8000 }),
    tryGetPosition({ enableHighAccuracy: false, maximumAge: 300000, timeout: 4000 }),
  ]);

  merge(freshHigh);
  merge(cachedHigh);
  merge(freshLow);
  merge(cachedLow);

  let acc = state.best?.accuracy ?? Infinity;
  if (state.best && acc <= GOOD_M) return state.best;

  // ── Tier 2: high-accuracy watch (phones / laptops with GPS) ─────────────
  if (!state.best || acc > GOOD_M) {
    try {
      merge(await watchForFix(7000, true, PRECISE_M));
      acc = state.best?.accuracy ?? Infinity;
      if (state.best && acc <= GOOD_M) return state.best;
    } catch (err) {
      lastError = err as GeolocationPositionError;
    }
  }

  // ── Tier 3: network/Wi‑Fi watch — critical for Windows desktop ─────────
  acc = state.best?.accuracy ?? Infinity;
  if (!state.best || acc > 2000) {
    try {
      merge(await watchForFix(6000, false));
    } catch (err) {
      lastError = err as GeolocationPositionError;
    }
  }

  if (state.best && isValidReading(state.best)) return state.best;

  // ── Tier 4: one last low-accuracy attempt with long cache ───────────────
  const lastResort = await tryGetPosition({
    enableHighAccuracy: false,
    maximumAge: 600000,
    timeout: 10000,
  });
  if (lastResort) return lastResort;

  throw new Error(geolocationErrorMessage(lastError ?? ({ code: 3 } as GeolocationPositionError)));
}

/** Keep refining after initial fix; calls onBetter when accuracy improves. */
export function refinePosition(
  baseline: GeoCoords,
  onBetter: (reading: GeoCoords) => void,
  maxMs = 12000
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return () => {};

  let best = baseline;
  const baselineAcc = baseline.accuracy ?? Infinity;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const reading: GeoCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      if (!isValidReading(reading)) return;

      const acc = reading.accuracy ?? Infinity;
      if (acc >= baselineAcc - 10 && acc > PRECISE_M) return;

      if (acc < (best.accuracy ?? Infinity)) {
        best = reading;
        onBetter(reading);
      }
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 0, timeout: maxMs }
  );

  const timer = setTimeout(() => {
    navigator.geolocation.clearWatch(watchId);
  }, maxMs);

  return () => {
    clearTimeout(timer);
    navigator.geolocation.clearWatch(watchId);
  };
}

export async function detectCurrentLocation(): Promise<GeoLocation> {
  const pos = await getCurrentPositionAsync();
  return resolveLocationFromGps(pos);
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback((): Promise<GeoCoords> => {
    setLoading(true);
    setError(null);
    return getCurrentPositionAsync()
      .then((pos) => {
        setLoading(false);
        return pos;
      })
      .catch((err) => {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Unable to get your location';
        setError(msg);
        throw new Error(msg);
      });
  }, []);

  return { getCurrentPosition, loading, error };
}

export async function reverseGeocode(lat: number, lng: number, accuracy?: number): Promise<string> {
  try {
    const q = accuracy != null ? `&accuracy=${accuracy}` : '';
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}${q}`, {
      cache: 'no-store',
    });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = await res.json();
    return data.label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function resolveLocationFromGps(pos: GeoCoords): Promise<GeoLocation> {
  const label = resolveLocationLabel(
    pos.lat,
    pos.lng,
    await reverseGeocode(pos.lat, pos.lng, pos.accuracy),
    pos.accuracy
  );

  return {
    lat: pos.lat,
    lng: pos.lng,
    label,
    accuracy: pos.accuracy,
  };
}

export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;
    return { lat: data.result.lat, lng: data.result.lng };
  } catch {
    return null;
  }
}

export async function geocodeAddressWithLabel(query: string): Promise<GeoLocation | null> {
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;
    return { lat: data.result.lat, lng: data.result.lng, label: data.result.label };
  } catch {
    return null;
  }
}

export const CITY_COORDS: Record<string, GeoCoords> = Object.fromEntries(
  POPULAR_CITIES.map((c) => [c.label, { lat: c.lat, lng: c.lng }])
);