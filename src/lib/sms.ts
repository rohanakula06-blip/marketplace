import twilio from 'twilio';
import { formatPhoneDisplay } from './phone';

export type SmsProvider = '2factor' | 'fast2sms' | 'msg91' | 'twilio';

export interface SmsResult {
  sent: boolean;
  provider: string;
  demo?: boolean;
}

function is2FactorConfigured() {
  return !!process.env.TWO_FACTOR_API_KEY;
}

function isTwilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

function isFast2SmsConfigured() {
  return !!process.env.FAST2SMS_API_KEY;
}

function isMsg91Configured() {
  return !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

export function getSmsProviderStatus() {
  return {
    configured: isSmsConfigured(),
    activeProvider: getActiveSmsProvider(),
    providers: {
      '2factor': { configured: is2FactorConfigured(), recommended: true, region: 'India' },
      fast2sms: { configured: isFast2SmsConfigured(), region: 'India' },
      msg91: { configured: isMsg91Configured(), region: 'India' },
      twilio: { configured: isTwilioConfigured(), region: 'Global' },
    },
  };
}

export function isSmsConfigured(): boolean {
  return getActiveSmsProvider() !== null;
}

export function getActiveSmsProvider(): SmsProvider | null {
  const preferred = process.env.SMS_PROVIDER as SmsProvider | undefined;

  const tryProvider = (p: SmsProvider): SmsProvider | null => {
    if (p === '2factor' && is2FactorConfigured()) return '2factor';
    if (p === 'fast2sms' && isFast2SmsConfigured()) return 'fast2sms';
    if (p === 'msg91' && isMsg91Configured()) return 'msg91';
    if (p === 'twilio' && isTwilioConfigured()) return 'twilio';
    return null;
  };

  if (preferred) {
    const active = tryProvider(preferred);
    if (active) return active;
  }

  return tryProvider('2factor') || tryProvider('fast2sms') || tryProvider('msg91') || tryProvider('twilio');
}

/** 2Factor.in — https://2factor.in (India OTP — AUTOGEN + VERIFY) */
export async function sendVia2FactorAutogen(phone: string): Promise<{ sessionId: string }> {
  const apiKey = process.env.TWO_FACTOR_API_KEY!;
  const phoneNumber = phone.replace('+', '');

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneNumber}/AUTOGEN`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    const msg = data.Details || data.Message || JSON.stringify(data);
    console.error('[SMS 2Factor]', msg);
    throw new Error(`SMS delivery failed: ${msg}`);
  }

  console.log(`[SMS 2Factor] OTP sent to ${formatPhoneDisplay(phone)}, session: ${data.Details}`);
  return { sessionId: data.Details as string };
}

/** Send a specific OTP code via 2Factor manual API */
async function sendVia2FactorManual(phone: string, code: string): Promise<SmsResult> {
  const apiKey = process.env.TWO_FACTOR_API_KEY!;
  const phoneNumber = phone.replace('+', '');

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneNumber}/${code}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    const msg = data.Details || data.Message || JSON.stringify(data);
    console.error('[SMS 2Factor]', msg);
    throw new Error(`SMS delivery failed: ${msg}`);
  }

  console.log(`[SMS 2Factor] OTP ${code} sent to ${formatPhoneDisplay(phone)}`);
  return { sent: true, provider: '2factor' };
}

/** Verify OTP via 2Factor session (AUTOGEN flow) */
export async function verify2FactorOtp(sessionId: string, otp: string): Promise<boolean> {
  const apiKey = process.env.TWO_FACTOR_API_KEY!;
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp.trim()}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.Status === 'Success' && data.Details === 'OTP Matched';
}

/** Fast2SMS — https://www.fast2sms.com (free credits for India) */
async function sendViaFast2SMS(phone: string, code: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY!;
  const numbers = phone.replace('+91', '');

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.return === false) {
    const msg = data.message || data.msg || JSON.stringify(data);
    console.error('[SMS Fast2SMS]', msg);
    throw new Error(`SMS delivery failed: ${msg}`);
  }

  console.log(`[SMS Fast2SMS] OTP sent to ${formatPhoneDisplay(phone)}`);
  return { sent: true, provider: 'fast2sms' };
}

/** MSG91 — https://msg91.com (India enterprise OTP) */
async function sendViaMSG91(phone: string, code: string): Promise<SmsResult> {
  const authkey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;
  const mobile = phone.replace('+', '');

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('authkey', authkey);
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', mobile);
  url.searchParams.set('otp', code);
  url.searchParams.set('otp_expiry', '5');
  url.searchParams.set('realTimeResponse', '1');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (data.type === 'error' || !res.ok) {
    const msg = data.message || data.msg || 'MSG91 delivery failed';
    console.error('[SMS MSG91]', msg);
    throw new Error(`SMS delivery failed: ${msg}`);
  }

  console.log(`[SMS MSG91] OTP sent to ${formatPhoneDisplay(phone)}`);
  return { sent: true, provider: 'msg91' };
}

/** Twilio — https://twilio.com (global) */
async function sendViaTwilio(phone: string, code: string): Promise<SmsResult> {
  const message = `Your LocalPro verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });

  console.log(`[SMS Twilio] OTP sent to ${formatPhoneDisplay(phone)}`);
  return { sent: true, provider: 'twilio' };
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const provider = getActiveSmsProvider();

  if (!provider) {
    throw new Error(
      'SMS provider not configured. Add TWO_FACTOR_API_KEY to .env. See SMS_SETUP.md.'
    );
  }

  switch (provider) {
    case '2factor':
      return sendVia2FactorManual(phone, code);
    case 'fast2sms':
      return sendViaFast2SMS(phone, code);
    case 'msg91':
      return sendViaMSG91(phone, code);
    case 'twilio':
      return sendViaTwilio(phone, code);
    default:
      throw new Error('No SMS provider available');
  }
}
