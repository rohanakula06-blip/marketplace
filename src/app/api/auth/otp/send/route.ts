import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { normalizePhone, isValidIndianPhone, generateOtp } from '@/lib/phone';
import { sendOtpSms, getSmsProviderStatus } from '@/lib/sms';

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_PER_HOUR = 5;

export async function POST(req: NextRequest) {
  try {
    const status = getSmsProviderStatus();
    if (!status.configured) {
      return NextResponse.json(
        {
          error: 'Real SMS is not configured yet. Add FAST2SMS_API_KEY to your .env file. See SMS_SETUP.md for free setup (takes 5 minutes).',
          providers: status.providers,
        },
        { status: 503 }
      );
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    if (!normalized || !isValidIndianPhone(phone)) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)' },
        { status: 400 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.otpCode.count({
      where: { phone: normalized, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again after an hour.' },
        { status: 429 }
      );
    }

    await prisma.otpCode.updateMany({
      where: { phone: normalized, verified: false },
      data: { verified: true },
    });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: { phone: normalized, code, expiresAt, purpose: 'login' },
    });

    const smsResult = await sendOtpSms(normalized, code);

    return NextResponse.json({
      success: true,
      message: `OTP sent via ${smsResult.provider} to ${normalized.slice(0, 3)}****${normalized.slice(-4)}`,
      phone: normalized,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      smsProvider: smsResult.provider,
      realSms: true,
    });
  } catch (error) {
    console.error('[OTP Send]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(getSmsProviderStatus());
}
