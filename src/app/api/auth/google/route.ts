import { NextResponse } from 'next/server';
import { getGoogleAuthUrl, isGoogleConfigured } from '@/lib/google-auth';

export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: 'Google login not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' },
      { status: 503 }
    );
  }

  const url = getGoogleAuthUrl();
  return NextResponse.redirect(url);
}
