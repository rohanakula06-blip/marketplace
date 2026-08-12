import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOtp } from '@/lib/phone';
import { isValidEmail, normalizeEmail, sendOtpEmail, getEmailProviderStatus, isEmailConfigured } from '@/lib/email';

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_PER_HOUR = 5;

export async function POST(req: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error: 'Email not configured. Add SMTP or RESEND_API_KEY to .env. See EMAIL_SETUP.md',
          ...getEmailProviderStatus(),
        },
        { status: 503 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.otpCode.count({
      where: { email: normalized, purpose: 'email_login', createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    await prisma.otpCode.updateMany({
      where: { email: normalized, purpose: 'email_login', verified: false },
      data: { verified: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: { email: normalized, code, expiresAt, purpose: 'email_login' },
    });

    const result = await sendOtpEmail(normalized, code);

    return NextResponse.json({
      success: true,
      message: `Login code sent to ${normalized.replace(/(.{2}).+(@.+)/, '$1***$2')}`,
      email: normalized,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      emailProvider: result.provider,
      realEmail: true,
    });
  } catch (error) {
    console.error('[Email OTP Send]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(getEmailProviderStatus());
}
