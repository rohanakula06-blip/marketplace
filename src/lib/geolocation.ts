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

/** Watch GPS briefly and keep the most accurate reading. */
function watchBestPosition(timeoutMs: number): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    let best: GeoCoords | null = null;
    let watchId = -1;

    const finish = (result: GeoCoords) => {
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
      resolve(result);
    };

    const fail = (err: GeolocationPositionError) => {
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
      if (best) finish(best);
      else reject(err);
    };

    const timer = setTimeout(() => {
      if (best) finish(best);
      else fail({ code: 3 } as GeolocationPositionError);
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
        if (reading.accuracy != null && reading.accuracy <= 80) {
          clearTimeout(timer);
          finish(reading);
        }
      },
      (err) => {
        clearTimeout(timer);
        fail(err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });
}

function isUsableAccuracy(accuracy?: number): boolean {
  return accuracy != null && accuracy <= 15000;
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case 1:
      return 'Location permission denied. Click the lock icon in your browser address bar → Allow location, then try again.';
    case 2:
      return 'Location unavailable. Turn on Location Services (Windows Settings → Privacy → Location) or search your area manually.';
    case 3:
      return 'Location timed out. Move near a window, try on your phone, or search for your area manually.';
    default:
      return 'Unable to get your location. Try again or search for your area manually.';
  }
}

/** Reliable GPS: try high-accuracy first, then fall back. Works on mobile + desktop. */
export async function getCurrentPositionAsync(): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Location requires HTTPS. Open the site via https:// or localhost.');
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (permission.state === 'denied') {
      throw new Error(geolocationErrorMessage({ code: 1 } as GeolocationPositionError));
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('permission')) throw err;
    // permissions API not supported — continue
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  ];

  let lastError: GeolocationPositionError | null = null;
  let bestReading: GeoCoords | null = null;

  for (const options of attempts) {
    try {
      const reading = await getPosition(options);
      if (!bestReading || (reading.accuracy ?? Infinity) < (bestReading.accuracy ?? Infinity)) {
        bestReading = reading;
      }
      if (isUsableAccuracy(reading.accuracy) && (reading.accuracy ?? Infinity) <= 500) {
        return reading;
      }
    } catch (err) {
      lastError = err as GeolocationPositionError;
      if (lastError.code === 1) break;
    }
  }

  try {
    const watched = await watchBestPosition(18000);
    if (!bestReading || (watched.accuracy ?? Infinity) < (bestReading.accuracy ?? Infinity)) {
      bestReading = watched;
    }
  } catch (err) {
    if (!bestReading) lastError = err as GeolocationPositionError;
  }

  if (bestReading) {
    if (!isUsableAccuracy(bestReading.accuracy)) {
      throw new Error(
        'GPS signal is too weak (location may be off by many km). Move outdoors, enable Location Services, or search your area manually.'
      );
    }
    return bestReading;
  }

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
    return new Promise(async (resolve, reject) => {
      setLoading(true);
      setError(null);
      try {
        const pos = await getCurrentPositionAsync();
        setLoading(false);
        resolve(pos);
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Unable to get your location';
        setError(msg);
        reject(new Error(msg));
      }
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

/** Keep exact GPS coordinates; only improve the human-readable label. */
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
