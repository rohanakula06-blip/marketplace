import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, workerId, rating, review } = await req.json();
  const reviewRecord = await prisma.review.create({
    data: { customerId: user.id, workerId, bookingId, rating, review },
  });

  const allReviews = await prisma.review.findMany({ where: { workerId } });
  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

  await prisma.workerProfile.update({
    where: { userId: workerId },
    data: { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length },
  });

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'reviewed' } });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking?.jobId) {
    await prisma.job.updateMany({
      where: { id: booking.jobId },
      data: { status: 'completed' },
    });
  }

  return NextResponse.json({ review: reviewRecord }, { status: 201 });
}
