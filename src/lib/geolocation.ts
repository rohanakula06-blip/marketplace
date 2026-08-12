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
      reject,
      options
    );
  });
}

/**
 * Best-effort precise GPS: watch position briefly and keep the most accurate reading.
 */
export async function getCurrentPositionAsync(): Promise<GeoCoords> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Location requires HTTPS. Open the site via https:// or localhost.');
  }

  return new Promise((resolve, reject) => {
    let best: GeoCoords | null = null;
    let settled = false;

    const finish = (result: GeoCoords) => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve(result);
    };

    const fail = (err: GeolocationPositionError) => {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      const msg =
        err.code === 1
          ? 'Location permission denied. Allow location in browser settings or pick your area manually.'
          : 'Unable to get your location. Try again or search for your area manually.';
      reject(new Error(msg));
    };

    const watchId = navigator.geolocation.watchPosition(
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
          finish(reading);
        }
      },
      fail,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    const timer = setTimeout(() => {
      if (best) finish(best);
      else {
        getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 })
          .then(finish)
          .catch(() =>
            getPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 0 })
              .then(finish)
              .catch(fail)
          );
      }
    }, 12000);
  });
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

export const CITY_COORDS: Record<string, GeoCoords> = {
  'Konaseema, Andhra Pradesh': { lat: 16.579, lng: 82.006 },
  'Amalapuram, Konaseema': { lat: 16.5787, lng: 82.0061 },
  'Rajahmundry, Andhra Pradesh': { lat: 17.0005, lng: 81.804 },
  'Kakinada, Andhra Pradesh': { lat: 16.9891, lng: 82.2471 },
  'Hyderabad, Telangana': { lat: 17.385, lng: 78.4867 },
  'Bangalore, Karnataka': { lat: 12.9716, lng: 77.5946 },
  'Mumbai, Maharashtra': { lat: 19.076, lng: 72.8777 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209 },
  'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
  'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
};
