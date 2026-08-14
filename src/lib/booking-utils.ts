/** Shared booking date/time helpers */

export const TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
] as const;

export function minBookingDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function defaultBookingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function defaultBookingTime(): string {
  return '10:00 AM';
}

export function formatBookingDateTime(date: string, time: string): string {
  if (!date) return time || '—';
  try {
    const parsed = new Date(`${date}T12:00:00`);
    const dateLabel = parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return time ? `${dateLabel} · ${time}` : dateLabel;
  } catch {
    return `${date}${time ? ` · ${time}` : ''}`;
  }
}

export function validateBookingSchedule(date: string, time: string): string | null {
  if (!date || !time) return 'Pick a date and time';
  const today = minBookingDate();
  if (date < today) return 'Date cannot be in the past';
  return null;
}

export function canCustomerRate(status: string): boolean {
  return status === 'completed' || status === 'paid';
}

export function canCustomerReport(status: string, alreadyReported: boolean): boolean {
  return status !== 'cancelled' && !alreadyReported;
}

export const REPORT_REASONS = [
  { id: 'no_show', label: 'No show / did not arrive' },
  { id: 'unprofessional', label: 'Unprofessional behavior' },
  { id: 'poor_quality', label: 'Poor quality work' },
  { id: 'overcharging', label: 'Overcharging or hidden fees' },
  { id: 'safety', label: 'Safety concern' },
  { id: 'other', label: 'Other' },
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  arriving: 'On the way',
  started: 'In progress',
  completed: 'Work done',
  paid: 'Paid',
  reviewed: 'Reviewed',
  cancelled: 'Cancelled',
};
