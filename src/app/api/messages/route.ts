import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId');
  const bookingId = searchParams.get('bookingId');

  const where: Record<string, unknown> = {
    OR: [{ senderId: user.id }, { receiverId: user.id }],
  };
  if (partnerId) {
    where.OR = [
      { senderId: user.id, receiverId: partnerId },
      { senderId: partnerId, receiverId: user.id },
    ];
  }
  if (bookingId) where.bookingId = bookingId;

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { timestamp: 'asc' },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId: body.receiverId,
      bookingId: body.bookingId,
      message: body.message,
      imageUrl: body.imageUrl,
      location: body.location,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: body.receiverId,
      title: 'New Message',
      message: `${user.name}: ${body.message.slice(0, 60)}...`,
      type: 'info',
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
