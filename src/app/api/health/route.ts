import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [users, workers, jobs, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.workerProfile.count(),
      prisma.job.count(),
      prisma.booking.count(),
    ]);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      stats: { users, workers, jobs, bookings },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
