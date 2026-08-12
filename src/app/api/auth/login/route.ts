import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, verifyPassword, createSession, setAuthCookie, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { workerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up first.' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Incorrect password. Try again or use email/mobile OTP.' }, { status: 401 });
    }

    const { token } = await createSession(user.id);
    await setAuthCookie(token);

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
