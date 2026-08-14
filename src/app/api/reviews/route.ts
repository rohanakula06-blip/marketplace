import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, workerId, rating, review } = await req.json();

  if (!bookingId || !workerId || rating == null) {
    return NextResponse.json({ error: 'bookingId, workerId, and rating are required' }, { status: 400 });
  }

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (booking.customerId !== user.id) {
    return NextResponse.json({ error: 'Only the customer can leave a review' }, { status: 403 });
  }

  if (booking.workerId !== workerId) {
    return NextResponse.json({ error: 'Worker does not match this booking' }, { status: 400 });
  }

  if (!['completed', 'paid'].includes(booking.status)) {
    return NextResponse.json({ error: 'Work must be completed before you can rate' }, { status: 400 });
  }

  const existing = await prisma.review.findFirst({ where: { bookingId } });
  if (existing) {
    return NextResponse.json({ error: 'You already reviewed this booking' }, { status: 409 });
  }

  const reviewRecord = await prisma.review.create({
    data: {
      customerId: user.id,
      workerId,
      bookingId,
      rating: stars,
      review: (review || '').trim() || 'Great service!',
    },
  });

  const allReviews = await prisma.review.findMany({ where: { workerId } });
  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

  await prisma.workerProfile.update({
    where: { userId: workerId },
    data: { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length },
  });

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'reviewed' } });

  if (booking.jobId) {
    await prisma.job.updateMany({
      where: { id: booking.jobId },
      data: { status: 'completed' },
    });
  }

  return NextResponse.json({ review: reviewRecord }, { status: 201 });
}
