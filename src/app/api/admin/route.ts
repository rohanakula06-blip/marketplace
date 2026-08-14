import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [customers, workers, jobs, bookings, verifications, reports] = await Promise.all([
    prisma.user.count({ where: { role: { in: ['customer', 'both'] } } }),
    prisma.workerProfile.count(),
    prisma.job.count(),
    prisma.booking.count(),
    prisma.workerProfile.count({ where: { verificationStatus: 'pending' } }),
    prisma.report.count({ where: { status: 'pending' } }),
  ]);

  return NextResponse.json({
    stats: { customers, workers, jobs, bookings, verifications, reports },
    pendingVerifications: await prisma.workerProfile.findMany({
      where: { verificationStatus: 'pending' },
      include: { user: { select: { name: true, email: true } } },
      take: 5,
    }),
  });
}
