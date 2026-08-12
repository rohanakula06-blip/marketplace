import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, verifyPassword, createSession, setAuthCookie, sanitizeUser, sessionClaimsFromUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const staySignedIn = rememberMe === true;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { workerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up first.' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Incorrect password. Try again or reset your password.' }, { status: 401 });
    }

    const { token } = await createSession(user.id, sessionClaimsFromUser(user), staySignedIn);
    await setAuthCookie(token, staySignedIn);

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
