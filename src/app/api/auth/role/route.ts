import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role } = await req.json();
  if (!['customer', 'worker', 'both'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
    include: { workerProfile: true },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      workerProfile: updated.workerProfile,
    },
  });
}
