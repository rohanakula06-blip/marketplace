import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, amount, method } = await req.json();
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount,
      method,
      status: 'completed',
      isDemo: true,
    },
  });

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'paid' } });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking) {
    await prisma.notification.create({
      data: {
        userId: booking.workerId,
        title: 'Payment Received',
        message: `Demo payment of ${amount} received for booking.`,
        type: 'success',
      },
    });
  }

  return NextResponse.json({
    payment,
    receipt: {
      id: payment.id,
      amount,
      method,
      status: 'completed',
      note: 'Demo Payment — No real money was charged.',
      date: new Date().toISOString(),
    },
  }, { status: 201 });
}
