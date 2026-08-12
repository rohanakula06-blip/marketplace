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
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      location,
      latitude,
      longitude,
      category,
      skills,
      experience,
      pricing,
      bio,
      languages,
      travelRadius,
      serviceAreas,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    }

    if (!category || !skills || !pricing) {
      return NextResponse.json({ error: 'Category, skills and pricing are required' }, { status: 400 });
    }

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'Location is required. Allow GPS or search your service area.' },
        { status: 400 }
      );
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
      return NextResponse.json({ error: 'Email already registered. Try logging in.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const locationLabel =
      typeof location === 'string' && location.trim()
        ? location.trim()
        : `${latitude}, ${longitude}`;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        role: 'worker',
        emailVerified: false,
        location: locationLabel,
        latitude: Number(latitude),
        longitude: Number(longitude),
        workerProfile: {
          create: {
            category,
            skills: Array.isArray(skills) ? skills.join(', ') : String(skills),
            experience: parseInt(String(experience), 10) || 0,
            pricing: String(pricing),
            availability: 'available',
            bio: bio?.trim() || null,
            serviceAreas: serviceAreas?.trim() || locationLabel.split(',')[0],
            travelRadius: parseFloat(String(travelRadius)) || 15,
            languages: Array.isArray(languages)
              ? languages.join(', ')
              : languages?.trim() || 'English',
            verificationStatus: 'verified',
            isAvailable: true,
          },
        },
      },
      include: { workerProfile: true },
    });

    try {
      const { sendWelcomeEmail, isEmailConfigured } = await import('@/lib/email');
      if (isEmailConfigured()) {
        await sendWelcomeEmail(normalizedEmail, name.trim());
      }
    } catch {
      /* non-blocking */
    }

    const { token } = await createSession(user.id, sessionClaimsFromUser(user));
    await setAuthCookie(token);

    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch (err) {
    console.error('[Register worker]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
