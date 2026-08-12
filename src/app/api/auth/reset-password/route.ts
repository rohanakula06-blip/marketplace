import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  hashPassword,
  createSession,
  setAuthCookie,
  sanitizeUser,
  sessionClaimsFromUser,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { include: { workerProfile: true } } },
    });

    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Request a new one.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
      include: { workerProfile: true },
    });

    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const { token: sessionToken } = await createSession(user.id, sessionClaimsFromUser(user), true);
    await setAuthCookie(sessionToken, true);

    return NextResponse.json({ user: sanitizeUser(user), message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Reset password]', err);
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 });
  }
}
