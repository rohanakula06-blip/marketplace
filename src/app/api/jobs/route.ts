import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_COORDS, DEFAULT_LOCATION } from '@/lib/constants';
import { calculateDistance } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine') === 'true';
  const category = searchParams.get('category');
  const status = searchParams.get('status') || 'open';
  const lat = parseFloat(searchParams.get('lat') || String(DEMO_COORDS.lat));
  const lng = parseFloat(searchParams.get('lng') || String(DEMO_COORDS.lng));

  if (mine) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const jobs = await prisma.job.findMany({
      where: { customerId: user.id, ...(status !== 'all' && { status }) },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ jobs });
  }

  const where: Record<string, unknown> = { status };
  if (category) where.category = category;

  const jobs = await prisma.job.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, location: true } },
      applications: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const results = jobs.map((j) => {
    const jLat = j.latitude || DEMO_COORDS.lat + (Math.random() - 0.5) * 0.08;
    const jLng = j.longitude || DEMO_COORDS.lng + (Math.random() - 0.5) * 0.08;
    return {
      ...j,
      distance: Math.round(calculateDistance(lat, lng, jLat, jLng) * 10) / 10,
      applicationCount: j.applications.length,
    };
  });

  results.sort((a, b) => a.distance - b.distance);
  return NextResponse.json({ jobs: results });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const job = await prisma.job.create({
    data: {
      customerId: user.id,
      title: body.title,
      category: body.category,
      description: body.description,
      location: body.location || user.location || DEFAULT_LOCATION,
      latitude: body.latitude || DEMO_COORDS.lat,
      longitude: body.longitude || DEMO_COORDS.lng,
      budget: body.budget,
      date: body.date,
      time: body.time,
      urgency: body.urgency || 'normal',
      photoUrl: body.photoUrl,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Job Posted',
      message: `Your job "${job.title}" is now visible to nearby workers.`,
      type: 'success',
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}
