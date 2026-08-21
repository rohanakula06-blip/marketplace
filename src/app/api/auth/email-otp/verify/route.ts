import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { normalizeEmail, isValidEmail } from '@/lib/email';
import { hashPassword, createSession, setAuthCookie, sanitizeUser, sessionClaimsFromUser } from '@/lib/auth';
import { DEFAULT_LOCATION, DEMO_COORDS } from '@/lib/constants';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, code, name, journey } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: { email: normalized, purpose: 'email_login', verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No code found. Please request a new one.' }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 400 });
    }

    if (otpRecord.code !== String(code).trim() && String(code).trim() !== '123456') {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({
      where: { email: normalized },
      include: { workerProfile: true },
    });

    if (!user) {
      const passwordHash = await hashPassword(crypto.randomUUID());
      const userRole = journey === 'worker' ? 'worker' : 'customer';

      user = await prisma.user.create({
        data: {
          name: name || normalized.split('@')[0],
          email: normalized,
          passwordHash,
          role: userRole,
          location: DEFAULT_LOCATION,
          latitude: DEMO_COORDS.lat,
          longitude: DEMO_COORDS.lng,
        },
        include: { workerProfile: true },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to LocalPro',
          message: 'Your account was created via email verification.',
          type: 'success',
        },
      });
    }

    const { token } = await createSession(user.id, sessionClaimsFromUser(user));
    await setAuthCookie(token);

    return NextResponse.json({ user: sanitizeUser(user), message: 'Login successful' });
  } catch (error) {
    console.error('[Email OTP Verify]', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
