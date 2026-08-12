import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'customer';

    const where =
      role === 'worker'
        ? { workerId: user.id }
        : { customerId: user.id };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        worker: {
          include: { workerProfile: true },
        },
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[Bookings GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load bookings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      workerId: body.workerId,
      jobId: body.jobId,
      service: body.service,
      description: body.description,
      date: body.date,
      time: body.time,
      price: body.price,
      address: body.address,
      urgency: body.urgency || 'normal',
      photoUrl: body.photoUrl,
      status: 'requested',
    },
  });

  await prisma.notification.create({
    data: {
      userId: body.workerId,
      title: 'New Booking Request',
      message: `${user.name} requested a ${body.service} booking.`,
      type: 'info',
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: { customer: true, worker: true },
  });

  const notifyId = user.id === booking.customerId ? booking.workerId : booking.customerId;
  await prisma.notification.create({
    data: {
      userId: notifyId,
      title: 'Booking Updated',
      message: `Booking status changed to: ${status}`,
      type: 'info',
    },
  });

  return NextResponse.json({ booking });
}
