/** Normalize Indian phone numbers to E.164 (+91XXXXXXXXXX) */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;

  return null;
}

export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone);
  if (!n) return phone;
  return `${n.slice(0, 3)} ${n.slice(3, 8)} ${n.slice(8)}`;
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function phoneToEmail(phone: string): string {
  const n = normalizePhone(phone) || phone;
  return `${n.replace('+', '')}@phone.localpro`;
}
