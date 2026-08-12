'use client';

import { useCallback, useState } from 'react';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  label: string;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback((): Promise<GeoCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setLoading(false);
          const msg =
            err.code === 1
              ? 'Location permission denied. Please enable location access or enter manually.'
              : 'Unable to get your location. Please try again or enter manually.';
          setError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  return { getCurrentPosition, loading, error };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address;
    if (!addr) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const parts = [addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.state_district, addr.state].filter(Boolean);
    return parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export const CITY_COORDS: Record<string, GeoCoords> = {
  'Konaseema, Andhra Pradesh': { lat: 16.579, lng: 82.006 },
  'Hyderabad, Telangana': { lat: 17.385, lng: 78.4867 },
  'Bangalore, Karnataka': { lat: 12.9716, lng: 77.5946 },
  'Mumbai, Maharashtra': { lat: 19.076, lng: 72.8777 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209 },
  'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
  'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
};
