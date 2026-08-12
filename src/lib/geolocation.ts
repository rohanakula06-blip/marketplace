'use client';

import { useCallback, useState } from 'react';
import { resolveLocationLabel } from '@/lib/location-utils';

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

function watchBestPosition(timeoutMs: number): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    let best: GeoCoords | null = null;
    let watchId = -1;

    const cleanup = () => {
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
    };

    const finish = (result: GeoCoords) => {
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      if (best) finish(best);
      else {
        cleanup();
        reject(Object.assign(new Error('timeout'), { code: 3 }));
      }
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const reading: GeoCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        if (!best || (reading.accuracy ?? Infinity) < (best.accuracy ?? Infinity)) {
          best = reading;
        }
        if (reading.accuracy != null && reading.accuracy <= 100) {
          clearTimeout(timer);
          finish(reading);
        }
      },
      (err) => {
        clearTimeout(timer);
        cleanup();
        if (best) resolve(best);
        else reject(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case 1:
      return 'Location permission denied. Allow location in your browser settings, then tap Use my location.';
    case 2:
      return 'Location unavailable. Enable Location in Windows Settings → Privacy, or search your city below.';
    case 3:
      return 'Location timed out. Try again near a window, or search your city manually.';
    default:
      return 'Could not get GPS. Search your city or area instead.';
  }
}

function pickBest(a: GeoCoords | null, b: GeoCoords | null): GeoCoords | null {
  if (!a) return b;
  if (!b) return a;
  return (a.accuracy ?? Infinity) <= (b.accuracy ?? Infinity) ? a : b;
}

/** Get the best available GPS reading. Always requests fresh coordinates. */
export async function getCurrentPositionAsync(): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Location requires HTTPS or localhost');
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 },
  ];

  let best: GeoCoords | null = null;
  let lastError: GeolocationPositionError | null = null;

  for (const options of attempts) {
    try {
      const reading = await getPosition(options);
      best = pickBest(best, reading);
      if (reading.accuracy != null && reading.accuracy <= 500) {
        return reading;
      }
    } catch (err) {
      lastError = err as GeolocationPositionError;
      if (lastError.code === 1) break;
    }
  }

  try {
    const watched = await watchBestPosition(20000);
    best = pickBest(best, watched);
  } catch (err) {
    if (!best) lastError = err as GeolocationPositionError;
  }

  if (best) return best;

  throw new Error(geolocationErrorMessage(lastError ?? ({ code: 0 } as GeolocationPositionError)));
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
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}${q}`);
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
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
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
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;
    return { lat: data.result.lat, lng: data.result.lng, label: data.result.label };
  } catch {
    return null;
  }
}

import { POPULAR_CITIES } from './location-utils';

export const CITY_COORDS: Record<string, GeoCoords> = Object.fromEntries(
  POPULAR_CITIES.map((c) => [c.label, { lat: c.lat, lng: c.lng }])
);
