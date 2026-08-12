import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailConfigured(): boolean {
  return (
    !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    !!process.env.RESEND_API_KEY
  );
}

function otpEmailHtml(code: string): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #1d4ed8; color: white; font-weight: bold; padding: 12px 20px; border-radius: 12px; font-size: 18px;">LocalPro</div>
      </div>
      <h2 style="color: #0f172a; text-align: center; margin-bottom: 8px;">Your Login Code</h2>
      <p style="color: #64748b; text-align: center; margin-bottom: 24px;">Use this code to sign in to LocalPro. Valid for 5 minutes.</p>
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${code}</span>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;
}

function welcomeEmailHtml(name: string): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #1d4ed8; color: white; font-weight: bold; padding: 12px 20px; border-radius: 12px; font-size: 18px;">LocalPro</div>
      </div>
      <h2 style="color: #0f172a; text-align: center;">Welcome, ${name}!</h2>
      <p style="color: #64748b; text-align: center;">Your account is ready. Log in anytime with your email and password.</p>
    </div>
  `;
}

async function sendHtmlViaResend(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'LocalPro <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Resend email failed');
  }
}

async function sendHtmlViaSmtp(to: string, subject: string, html: string, text: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"LocalPro" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

async function sendViaResend(to: string, code: string): Promise<void> {
  await sendHtmlViaResend(to, `${code} is your LocalPro login code`, otpEmailHtml(code));
}

async function sendViaSmtp(to: string, code: string): Promise<void> {
  await sendHtmlViaSmtp(
    to,
    `${code} is your LocalPro login code`,
    otpEmailHtml(code),
    `Your LocalPro login code is: ${code}. Valid for 5 minutes.`
  );
}

export async function sendOtpEmail(to: string, code: string): Promise<{ provider: string }> {
  const email = normalizeEmail(to);

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(email, code);
    console.log(`[Email Resend] OTP sent to ${email}`);
    return { provider: 'resend' };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp(email, code);
    console.log(`[Email SMTP] OTP sent to ${email}`);
    return { provider: 'smtp' };
  }

  throw new Error(
    'Email not configured. Add SMTP settings or RESEND_API_KEY to .env. See EMAIL_SETUP.md'
  );
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const email = normalizeEmail(to);
  const subject = 'Welcome to LocalPro';
  const html = welcomeEmailHtml(name);
  const text = `Welcome to LocalPro, ${name}! Your account is ready.`;

  if (process.env.RESEND_API_KEY) {
    await sendHtmlViaResend(email, subject, html);
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendHtmlViaSmtp(email, subject, html, text);
  }
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const to = process.env.SMTP_USER || process.env.CONTACT_EMAIL || 'support@localpro.demo';
  const html = `
    <h2>New LocalPro Contact Message</h2>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br>')}</p>
  `;
  const text = `From: ${data.name} (${data.email})\nSubject: ${data.subject}\n\n${data.message}`;

  if (process.env.RESEND_API_KEY) {
    await sendHtmlViaResend(to, `[LocalPro Contact] ${data.subject}`, html);
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendHtmlViaSmtp(to, `[LocalPro Contact] ${data.subject}`, html, text);
    return;
  }

  console.log('[Contact] Email not configured. Message logged:', data);
}

export function getEmailProviderStatus() {
  return {
    configured: isEmailConfigured(),
    provider: process.env.RESEND_API_KEY ? 'resend' : process.env.SMTP_HOST ? 'smtp' : null,
  };
}
