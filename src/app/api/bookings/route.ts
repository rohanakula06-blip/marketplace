import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEFAULT_LOCATION, DEMO_COORDS } from '@/lib/constants';

const WORKER_NEXT: Record<string, string[]> = {
  requested: ['accepted', 'cancelled'],
  accepted: ['arriving', 'started', 'cancelled'],
  confirmed: ['arriving', 'started'],
  arriving: ['started'],
  started: ['completed'],
};

const CUSTOMER_NEXT: Record<string, string[]> = {
  accepted: ['confirmed', 'cancelled'],
  completed: ['paid'],
};

async function closeLinkedJob(jobId: string | null | undefined) {
  if (!jobId) return;
  await prisma.job.updateMany({
    where: { id: jobId, status: { in: ['open', 'assigned'] } },
    data: { status: 'completed' },
  });
}

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
        ...(role === 'customer'
          ? {
              reports: {
                where: { customerId: user.id },
                select: { id: true, reason: true, status: true, createdAt: true },
              },
            }
          : {}),
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

  // Validate required fields
  if (!body.workerId) {
    return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
  }
  if (!body.service) {
    return NextResponse.json({ error: 'Service is required' }, { status: 400 });
  }
  if (!body.date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }
  if (!body.time) {
    return NextResponse.json({ error: 'Time is required' }, { status: 400 });
  }

  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId: body.workerId },
  });
  if (!workerProfile) {
    return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
  }
  if (!workerProfile.isAvailable) {
    return NextResponse.json(
      { error: 'This professional is currently offline and not accepting bookings.' },
      { status: 409 }
    );
  }

  // If jobId is not provided, create a new job
  let jobId: string;
  if (!body.jobId) {
    const job = await prisma.job.create({
      data: {
        customerId: user.id,
        title: body.title || 'Untitled Job',
        category: body.category || 'other',
        description: body.description || 'No description',
        location: body.location || user.location || DEFAULT_LOCATION,
        latitude: body.latitude || DEMO_COORDS.lat,
        longitude: body.longitude || DEMO_COORDS.lng,
        budget: body.budget || '0',
        date: body.date,
        time: body.time,
        urgency: body.urgency || 'normal',
        photoUrl: body.photoUrl,
      },
    });
    jobId = job.id;
  } else {
    jobId = body.jobId;
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      workerId: body.workerId,
      jobId,
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
      message: `${user.name} requested a ${body.service} booking for ${body.date} at ${body.time}.`,
      type: 'info',
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, action } = await req.json();

  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { job: true },
  });
  if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isCustomer = user.id === existing.customerId;
  const isWorker = user.id === existing.workerId;
  if (!isCustomer && !isWorker) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Customer confirms task done — closes linked job from Find Work
  if (action === 'confirm_task') {
    if (!isCustomer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['completed', 'paid', 'reviewed'].includes(existing.status)) {
      return NextResponse.json({ error: 'Work must be marked complete first' }, { status: 400 });
    }
    await closeLinkedJob(existing.jobId);
    await prisma.notification.create({
      data: {
        userId: existing.workerId,
        title: 'Task confirmed',
        message: `${user.name} confirmed the task is completed.`,
        type: 'success',
      },
    });
    return NextResponse.json({ booking: existing, jobClosed: true });
  }

  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });

  const allowed = isWorker
    ? WORKER_NEXT[existing.status] ?? []
    : CUSTOMER_NEXT[existing.status] ?? [];

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot change status from "${existing.status}" to "${status}"` },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: { customer: true, worker: true, job: true },
  });

  if (status === 'completed') {
    await prisma.workerProfile.update({
      where: { userId: existing.workerId },
      data: { completedJobs: { increment: 1 } },
    });
  }

  const notifyId = isCustomer ? booking.workerId : booking.customerId;
  await prisma.notification.create({
    data: {
      userId: notifyId,
      title: 'Booking Updated',
      message: `Booking is now: ${status.replace('_', ' ')}`,
      type: 'info',
    },
  });

  return NextResponse.json({ booking });
}
