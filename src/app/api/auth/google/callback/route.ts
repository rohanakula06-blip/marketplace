import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { exchangeGoogleCode, getGoogleUser, isGoogleConfigured } from '@/lib/google-auth';
import { hashPassword, createSession, setAuthCookie, sessionClaimsFromUser } from '@/lib/auth';
import { normalizeEmail } from '@/lib/email';
import { DEFAULT_LOCATION, DEMO_COORDS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=google_not_configured`);
  }

  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=google_auth_cancelled`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const googleUser = await getGoogleUser(tokens.access_token);

    if (!googleUser.email || !googleUser.verified_email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=email_not_verified`);
    }

    const email = normalizeEmail(googleUser.email);

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.id }, { email }],
      },
      include: { workerProfile: true },
    });

    if (user) {
      // Link Google account to existing email user
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.id, emailVerified: true, name: user.name || googleUser.name },
          include: { workerProfile: true },
        });
      }
    } else {
      const passwordHash = await hashPassword(crypto.randomUUID());
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email,
          googleId: googleUser.id,
          passwordHash,
          emailVerified: true,
          role: 'customer',
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
          message: `Signed in with Google (${email})`,
          type: 'success',
        },
      });
    }

    const { token } = await createSession(user.id, sessionClaimsFromUser(user));
    await setAuthCookie(token);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer?welcome=google`);
  } catch (err) {
    console.error('[Google OAuth]', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=google_auth_failed`);
  }
}
