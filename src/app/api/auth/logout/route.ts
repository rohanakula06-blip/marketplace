import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { clearAuthCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('localpro_token')?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
