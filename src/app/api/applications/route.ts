import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const application = await prisma.application.create({
    data: {
      jobId: body.jobId,
      workerId: user.id,
      proposedPrice: body.proposedPrice,
      message: body.message,
      availability: body.availability,
      estimatedArrival: body.estimatedArrival,
    },
  });

  const job = await prisma.job.findUnique({ where: { id: body.jobId } });
  if (job) {
    await prisma.notification.create({
      data: {
        userId: job.customerId,
        title: 'New Application',
        message: `${user.name} applied for "${job.title}".`,
        type: 'info',
      },
    });
  }

  return NextResponse.json({ application }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  const application = await prisma.application.update({
    where: { id },
    data: { status },
    include: { job: true, worker: true },
  });

  if (status === 'accepted' && application.job) {
    await prisma.job.update({ where: { id: application.jobId }, data: { status: 'assigned' } });
    await prisma.booking.create({
      data: {
        customerId: application.job.customerId,
        workerId: application.workerId,
        jobId: application.jobId,
        service: application.job.category,
        description: application.job.description,
        date: application.job.date,
        time: application.job.time,
        price: application.proposedPrice,
        status: 'confirmed',
        address: application.job.location,
        urgency: application.job.urgency,
      },
    });
    await prisma.notification.create({
      data: {
        userId: application.workerId,
        title: 'Application Accepted',
        message: `Your application for "${application.job.title}" was accepted!`,
        type: 'success',
      },
    });
  }

  return NextResponse.json({ application });
}
