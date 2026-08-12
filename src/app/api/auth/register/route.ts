import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, createSession, setAuthCookie, sanitizeUser } from '@/lib/auth';
import { DEFAULT_LOCATION, DEMO_COORDS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, location, journey, latitude, longitude } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = journey === 'worker' ? 'worker' : role || 'customer';

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone || null,
        role: userRole,
        emailVerified: false,
        location: location || DEFAULT_LOCATION,
        latitude: latitude ?? DEMO_COORDS.lat,
        longitude: longitude ?? DEMO_COORDS.lng,
      },
      include: { workerProfile: true },
    });

    // Send welcome email via Gmail SMTP if configured
    try {
      const { sendWelcomeEmail, isEmailConfigured } = await import('@/lib/email');
      if (isEmailConfigured()) {
        await sendWelcomeEmail(normalizedEmail, name);
      }
    } catch {
      // non-blocking
    }

    const { token } = await createSession(user.id);
    await setAuthCookie(token);

    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
