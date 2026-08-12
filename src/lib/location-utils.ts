/** Konaseema (east AP) — Amalapuram, Rajahmundry. Krishna/Gudivada is west (~80.9°E). */
export const KONASEEMA_MIN_LNG = 81.55;

export const DEMO_COORDS = { lat: 16.579, lng: 82.006 };

export type KnownCity = { label: string; lat: number; lng: number };

/** Quick-select cities shown in the location picker (works anywhere in India via GPS/search too). */
export const POPULAR_CITIES: KnownCity[] = [
  { label: 'Amalapuram, Konaseema', lat: 16.5787, lng: 82.0061 },
  { label: 'Konaseema, Andhra Pradesh', lat: 16.579, lng: 82.006 },
  { label: 'Rajahmundry, Andhra Pradesh', lat: 17.0005, lng: 81.804 },
  { label: 'Kakinada, Andhra Pradesh', lat: 16.9891, lng: 82.2471 },
  { label: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { label: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lng: 80.648 },
  { label: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
  { label: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { label: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
  { label: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { label: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
];

export const POPULAR_CITY_LABELS = POPULAR_CITIES.map((c) => c.label);

export const KNOWN_CITIES: KnownCity[] = [
  ...POPULAR_CITIES,
  { label: 'Gudivada, Krishna', lat: 16.4355, lng: 80.9925 },
];

export function isApproximateAccuracy(accuracyMeters?: number | null): boolean {
  return accuracyMeters == null || accuracyMeters > 5000;
}

export function isDemoCoords(lat: number, lng: number): boolean {
  return Math.abs(lat - DEMO_COORDS.lat) < 0.02 && Math.abs(lng - DEMO_COORDS.lng) < 0.02;
}

export function hasRealCoords(lat?: number | null, lng?: number | null): lat is number {
  return lat != null && lng != null && !isDemoCoords(lat, lng);
}

export function isKonaseemaLng(lng: number): boolean {
  return lng >= KONASEEMA_MIN_LNG;
}

export function isKrishnaWestLng(lng: number): boolean {
  return lng < 81.35;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Only rewrite label when coarse GPS clearly picked the wrong district. Never move lat/lng. */
export function resolveLocationLabel(
  lat: number,
  lng: number,
  geocodedLabel: string,
  accuracyMeters?: number
): string {
  const lower = geocodedLabel.toLowerCase();
  const coarse = accuracyMeters == null || accuracyMeters > 5000;

  if (coarse && isKrishnaWestLng(lng) && (lower.includes('gudivada') || lower.includes('krishna'))) {
    return geocodedLabel;
  }

  return geocodedLabel;
}

export function formatAccuracy(accuracyMeters?: number): string | null {
  if (accuracyMeters == null) return null;
  if (accuracyMeters <= 50) return `±${Math.round(accuracyMeters)} m`;
  if (accuracyMeters <= 1000) return `±${Math.round(accuracyMeters)} m`;
  return `±${(accuracyMeters / 1000).toFixed(1)} km (approximate)`;
}
