import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_COORDS } from '@/lib/constants';

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { location, latitude, longitude } = await req.json();

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(location && { location }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });

    return NextResponse.json({
      location: updated.location,
      latitude: updated.latitude,
      longitude: updated.longitude,
    });
  } catch {
    // User may exist only in JWT on another Vercel serverless instance.
    return NextResponse.json({
      location: location ?? user.location,
      latitude: latitude ?? user.latitude ?? DEMO_COORDS.lat,
      longitude: longitude ?? user.longitude ?? DEMO_COORDS.lng,
    });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    location: user.location,
    latitude: user.latitude ?? DEMO_COORDS.lat,
    longitude: user.longitude ?? DEMO_COORDS.lng,
  });
}
