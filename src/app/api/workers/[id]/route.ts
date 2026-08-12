import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { summarizeReviews } from '@/lib/ai';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.workerProfile.findUnique({
    where: { userId: id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, location: true } },
      documents: true,
    },
  });

  if (!profile) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { workerId: id },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const reviewSummary = summarizeReviews(reviews);

  return NextResponse.json({
    worker: {
      ...profile,
      user: profile.user,
      skills: profile.skills.split(',').map((s) => s.trim()),
      languages: profile.languages.split(',').map((s) => s.trim()),
      serviceAreas: profile.serviceAreas?.split(',').map((s) => s.trim()) || [],
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        customerName: r.customer.name,
        createdAt: r.createdAt,
      })),
      reviewSummary,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.workerProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: 'Worker profile already exists' }, { status: 409 });
  }

  const profile = await prisma.workerProfile.create({
    data: {
      userId: user.id,
      category: body.category,
      skills: Array.isArray(body.skills) ? body.skills.join(', ') : body.skills,
      experience: parseInt(body.experience) || 0,
      pricing: body.pricing,
      availability: body.availability || 'weekdays',
      bio: body.bio,
      serviceAreas: body.serviceAreas,
      travelRadius: parseFloat(body.travelRadius) || 10,
      languages: Array.isArray(body.languages) ? body.languages.join(', ') : body.languages || 'English',
      profilePhoto: body.profilePhoto,
      verificationStatus: 'verified',
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'worker',
      ...(body.latitude != null && { latitude: Number(body.latitude) }),
      ...(body.longitude != null && { longitude: Number(body.longitude) }),
      ...(body.location && { location: body.location }),
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (user.id !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const profile = await prisma.workerProfile.update({
    where: { userId: id },
    data: {
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      ...(body.availability && { availability: body.availability }),
      ...(body.pricing && { pricing: body.pricing }),
    },
  });

  return NextResponse.json({ profile });
}
