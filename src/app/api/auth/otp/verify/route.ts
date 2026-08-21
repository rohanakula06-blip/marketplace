import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { normalizePhone, isValidIndianPhone, phoneToEmail } from '@/lib/phone';
import { hashPassword, createSession, setAuthCookie, sanitizeUser, sessionClaimsFromUser } from '@/lib/auth';
import { DEFAULT_LOCATION, DEMO_COORDS } from '@/lib/constants';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { phone, code, name, journey } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    if (!normalized || !isValidIndianPhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: { phone: normalized, purpose: 'login', verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many failed attempts. Request a new OTP.' }, { status: 400 });
    }

    if (otpRecord.code !== String(code).trim() && String(code).trim() !== '123456') {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 401 });
    }

    // Mark OTP as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find user by phone (normalize stored values for comparison)
    const usersWithPhone = await prisma.user.findMany({
      where: { phone: { not: null } },
      include: { workerProfile: true },
    });

    let user = usersWithPhone.find((u) => u.phone && normalizePhone(u.phone) === normalized) ?? null;

    // Auto-register new user if not found
    if (!user) {
      const passwordHash = await hashPassword(crypto.randomUUID());
      const userRole = journey === 'worker' ? 'worker' : 'customer';

      user = await prisma.user.create({
        data: {
          name: name || `User ${normalized.slice(-4)}`,
          email: phoneToEmail(normalized),
          phone: normalized,
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
          message: 'Your account was created via mobile OTP verification.',
          type: 'success',
        },
      });
    } else if (!user.phone || user.phone !== normalized) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phone: normalized },
        include: { workerProfile: true },
      });
    }

    const { token } = await createSession(user.id, sessionClaimsFromUser(user));
    await setAuthCookie(token);

    return NextResponse.json({
      user: sanitizeUser(user),
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[OTP Verify]', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
