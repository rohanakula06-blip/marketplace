import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_HEADERS = {
  'User-Agent': 'LocalPro/1.0 (local services marketplace)',
  'Accept-Language': 'en',
};

function formatSearchLabel(item: {
  display_name?: string;
  address?: Record<string, string | undefined>;
}): string {
  const addr = item.address ?? {};
  const parts = [
    addr.neighbourhood || addr.suburb || addr.village || addr.town,
    addr.city || addr.town || addr.municipality || addr.county,
    addr.state,
  ]
    .filter(Boolean)
    .filter((p, i, a) => a.indexOf(p) === i) as string[];

  if (parts.length > 0) return parts.slice(0, 3).join(', ');
  return item.display_name?.split(',').slice(0, 3).join(', ').trim() || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json({ result: null });
    }

    const data = await res.json();
    if (!data[0]) {
      return NextResponse.json({ result: null });
    }

    // Prefer city/town results over very broad admin areas
    const ranked = [...data].sort((a: { type?: string; importance?: number }, b: { type?: string; importance?: number }) => {
      const typeScore = (t?: string) => {
        if (!t) return 0;
        if (['house', 'building', 'residential', 'neighbourhood', 'suburb', 'village'].includes(t)) return 4;
        if (['town', 'city'].includes(t)) return 3;
        if (['administrative', 'county'].includes(t)) return 1;
        return 2;
      };
      const diff = typeScore(b.type) - typeScore(a.type);
      if (diff !== 0) return diff;
      return (b.importance ?? 0) - (a.importance ?? 0);
    });

    const best = ranked[0];

    return NextResponse.json({
      result: {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        label: formatSearchLabel(best) || q,
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
