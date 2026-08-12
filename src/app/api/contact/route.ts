import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail, sendContactEmail, isEmailConfigured } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await sendContactEmail({
      name: name.trim(),
      email: normalizeEmail(email),
      subject: subject.trim(),
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      emailSent: isEmailConfigured(),
    });
  } catch (err) {
    console.error('[Contact]', err);
    return NextResponse.json({ error: 'Failed to send message. Try again later.' }, { status: 500 });
  }
}
