import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { location, latitude, longitude } = await req.json();

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
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    location: user.location,
    latitude: user.latitude,
    longitude: user.longitude,
  });
}
