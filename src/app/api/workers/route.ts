import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateDistance } from '@/lib/utils';
import { calculateMatchScore } from '@/lib/ai';
import { DEMO_COORDS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'best_match';
  const lat = parseFloat(searchParams.get('lat') || String(DEMO_COORDS.lat));
  const lng = parseFloat(searchParams.get('lng') || String(DEMO_COORDS.lng));

  const where: Record<string, unknown> = {
    verificationStatus: { in: ['verified', 'pending'] },
  };
  if (category) where.category = category;

  const profiles = await prisma.workerProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, location: true, latitude: true, longitude: true } },
      documents: true,
    },
  });

  let results = profiles.map((p) => {
    const wLat = p.user.latitude ?? DEMO_COORDS.lat;
    const wLng = p.user.longitude ?? DEMO_COORDS.lng;
    const distance = calculateDistance(lat, lng, wLat, wLng);
    const matchScore = calculateMatchScore(p, category || p.category, distance);
    return {
      id: p.userId,
      profileId: p.id,
      name: p.user.name,
      category: p.category,
      skills: p.skills.split(',').map((s) => s.trim()),
      experience: p.experience,
      pricing: p.pricing,
      availability: p.availability,
      isAvailable: p.isAvailable,
      verificationStatus: p.verificationStatus,
      rating: p.rating,
      reviewCount: p.reviewCount,
      completedJobs: p.completedJobs,
      languages: p.languages.split(',').map((s) => s.trim()),
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      location: p.user.location,
      latitude: wLat,
      longitude: wLng,
      distance: Math.round(distance * 10) / 10,
      matchScore,
      whyRecommended: `Strong ${p.category} skills, ${p.experience} years experience, ${p.rating}★ rating, ${distance.toFixed(1)} km away.`,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.category.includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  switch (sort) {
    case 'nearest':
      results.sort((a, b) => a.distance - b.distance);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'price':
      results.sort((a, b) => a.pricing.localeCompare(b.pricing));
      break;
    default:
      results.sort((a, b) => b.matchScore - a.matchScore);
  }

  return NextResponse.json({ workers: results });
  } catch (error) {
    console.error('[Workers GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load workers' },
      { status: 500 }
    );
  }
}
