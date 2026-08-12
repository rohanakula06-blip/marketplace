import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  getCurrentUser,
  sessionClaimsFromUser,
  signToken,
  setAuthCookie,
} from '@/lib/auth';

async function refreshAuthCookie(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  location: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined
) {
  const token = signToken(user.id, {
    ...sessionClaimsFromUser(user),
    location: location ?? user.location,
    latitude: latitude ?? user.latitude,
    longitude: longitude ?? user.longitude,
  });
  await setAuthCookie(token);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { location, latitude, longitude } = await req.json();

  const nextLocation = location ?? user.location;
  const nextLat = latitude !== undefined ? latitude : user.latitude;
  const nextLng = longitude !== undefined ? longitude : user.longitude;

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(location && { location }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });

    await refreshAuthCookie(user, updated.location, updated.latitude, updated.longitude);

    return NextResponse.json({
      location: updated.location,
      latitude: updated.latitude,
      longitude: updated.longitude,
    });
  } catch {
    await refreshAuthCookie(user, nextLocation, nextLat, nextLng);

    return NextResponse.json({
      location: nextLocation,
      latitude: nextLat,
      longitude: nextLng,
    });
  }
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
