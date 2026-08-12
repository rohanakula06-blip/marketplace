import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_HEADERS = {
  'User-Agent': 'LocalPro/1.0 (local services marketplace)',
  'Accept-Language': 'en',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ result: null });
    }

    const data = await res.json();
    if (!data[0]) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({
      result: {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        label: data[0].display_name?.split(',').slice(0, 3).join(', ').trim() || q,
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
