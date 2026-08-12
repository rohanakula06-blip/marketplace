import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { isEmailConfigured, normalizeEmail, sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email is not configured. Contact support or configure SMTP in .env.' },
        { status: 503 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(normalizedEmail, user.name, resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[Forgot password]', err);
    return NextResponse.json({ error: 'Could not send reset email. Try again later.' }, { status: 500 });
  }
}
