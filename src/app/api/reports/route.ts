import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VALID_REASONS = [
  'no_show',
  'unprofessional',
  'poor_quality',
  'overcharging',
  'safety',
  'other',
] as const;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, workerId, reason, details } = await req.json();

  if (!bookingId || !workerId || !reason) {
    return NextResponse.json({ error: 'bookingId, workerId, and reason are required' }, { status: 400 });
  }

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (booking.customerId !== user.id) {
    return NextResponse.json({ error: 'Only the customer can report on this booking' }, { status: 403 });
  }

  if (booking.workerId !== workerId) {
    return NextResponse.json({ error: 'Worker does not match this booking' }, { status: 400 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot report a cancelled booking' }, { status: 400 });
  }

  const existing = await prisma.report.findUnique({
    where: { bookingId_customerId: { bookingId, customerId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'You already reported this booking' }, { status: 409 });
  }

  const report = await prisma.report.create({
    data: {
      bookingId,
      customerId: user.id,
      workerId,
      reason,
      details: details?.trim() || null,
      status: 'pending',
    },
  });

  await prisma.notification.create({
    data: {
      userId: workerId,
      title: 'Customer report received',
      message: `${user.name} submitted a report regarding booking "${booking.service}". Our team will review it.`,
      type: 'report',
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
