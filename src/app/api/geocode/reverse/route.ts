import { NextRequest, NextResponse } from 'next/server';
import { resolveLocationLabel } from '@/lib/location-utils';

const NOMINATIM_HEADERS = {
  'User-Agent': 'LocalPro/1.0 (local services marketplace)',
  'Accept-Language': 'en',
};

/** Precise Indian address: neighbourhood/village + town + district. */
function formatPreciseIndianAddress(
  address: Record<string, string | undefined>,
  displayName?: string
) {
  const parts = [
    address.neighbourhood,
    address.suburb,
    address.village,
    address.town || address.county || address.city || address.municipality,
    address.state_district,
    address.state,
  ]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index) as string[];

  if (parts.length > 0) return parts.slice(0, 4).join(', ');
  return displayName?.split(',').slice(0, 4).join(', ').trim() || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const accuracy = searchParams.get('accuracy');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const accuracyNum = accuracy ? parseFloat(accuracy) : undefined;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
      { headers: NOMINATIM_HEADERS, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        label: `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`,
        lat: latNum,
        lng: lngNum,
      });
    }

    const data = await res.json();
    const geocoded =
      formatPreciseIndianAddress(data.address ?? {}, data.display_name) ||
      `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`;

    const label = resolveLocationLabel(latNum, lngNum, geocoded, accuracyNum);

    return NextResponse.json({ label, lat: latNum, lng: lngNum, geocoded });
  } catch {
    return NextResponse.json({
      label: `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`,
      lat: latNum,
      lng: lngNum,
    });
  }
}
