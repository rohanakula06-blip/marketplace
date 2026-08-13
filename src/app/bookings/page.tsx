'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountPageShell, AccountCard } from '@/components/account/AccountPageShell';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { MapPin, Clock, Briefcase, Calendar, ChevronRight, Loader2, Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { BOOKING_STATUS_LABELS, formatBookingDateTime } from '@/lib/booking-utils';

interface Booking {
  id: string;
  service: string;
  description: string | null;
  date: string;
  time: string;
  price: string;
  status: string;
  address: string | null;
  jobId: string | null;
  customer: { id: string; name: string };
  worker: { id: string; name: string; workerProfile?: { category: string } };
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
  accepted: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-200 border border-green-500/30',
  arriving: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
  started: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
  completed: 'bg-teal-500/20 text-teal-200 border border-teal-500/30',
  paid: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
  reviewed: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-200 border border-red-500/30',
};

export default function BookingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const isPro = !!user?.workerProfile;
  const { setMessageModal, setPaymentModal, setReviewModal, showToast, reviewModal } = useUIStore();
  const prevReviewOpen = useRef(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [role, setRole] = useState<'customer' | 'worker'>(isPro ? 'worker' : 'customer');
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async (r: 'customer' | 'worker') => {
    setLoading(true);
    try {
      const data = await api.bookings.list(r);
      setBookings(data.bookings as unknown as Booking[]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push('/login');
      else showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const r = user.workerProfile ? 'worker' : 'customer';
    setRole(r);
    loadBookings(r);
  }, [user, authReady, router, loadBookings]);

  useEffect(() => {
    if (prevReviewOpen.current && !reviewModal) {
      loadBookings(role);
    }
    prevReviewOpen.current = !!reviewModal;
  }, [reviewModal, role, loadBookings]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const data = await api.bookings.update(id, { status });
      setBookings((b) =>
        b.map((x) => (x.id === id ? { ...x, ...(data.booking as unknown as Booking) } : x))
      );
      showToast(`Booking updated: ${BOOKING_STATUS_LABELS[status] || status}`, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update booking', 'error');
    }
  };

  const confirmTask = async (id: string) => {
    try {
      await api.bookings.update(id, { action: 'confirm_task' });
      showToast('Task marked complete — removed from Find Work listings', 'success');
      if (role === 'customer') loadBookings('customer');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to confirm task', 'error');
    }
  };

  if (!authReady) return <AccountPageShell variant={isPro ? 'worker' : 'customer'} loading />;
  if (!user) return null;

  return (
    <AccountPageShell variant={role === 'worker' ? 'worker' : 'customer'}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-wide mb-1', role === 'worker' ? 'text-teal-400' : 'text-amber-400')}>
              {role === 'worker' ? 'Professional' : 'Customer'}
            </p>
            <h1 className="text-3xl font-bold text-white">
              {role === 'worker' ? 'My Jobs & Bookings' : 'My Bookings'}
            </h1>
            <p className="mt-1 text-slate-400">{bookings.length} active records</p>
          </div>
          {user.workerProfile && (
            <div className="flex gap-2">
              {(['customer', 'worker'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    loadBookings(r);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium capitalize',
                    role === r
                      ? r === 'worker'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900'
                      : 'border border-white/15 text-slate-300 bg-white/5 hover:bg-white/10'
                  )}
                >
                  As {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="animate-spin" /> Loading…
          </div>
        ) : bookings.length === 0 ? (
          <AccountCard className="p-12 text-center">
            <Calendar className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="font-semibold text-white mb-2">No bookings yet</h3>
            <Link
              href={role === 'customer' ? '/find-workers' : '/find-jobs'}
              className={cn(
                'inline-block px-5 py-2.5 rounded-xl font-medium mt-2',
                role === 'worker'
                  ? 'bg-teal-600 text-white hover:bg-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900'
              )}
            >
              {role === 'customer' ? 'Find a Professional' : 'Find Work'}
            </Link>
          </AccountCard>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <AccountCard key={b.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white capitalize">{b.service}</h3>
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', STATUS_COLORS[b.status] || 'bg-slate-500/20 text-slate-200')}>
                        {BOOKING_STATUS_LABELS[b.status] || b.status}
                      </span>
                    </div>
                    {b.description && <p className="text-sm text-slate-400 mb-2">{b.description}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatBookingDateTime(b.date, b.time)}
                      </span>
                      {b.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {b.address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {role === 'customer' ? b.worker.name : b.customer.name}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-amber-400 mt-2">{b.price}</p>
                  </div>
                  <ChevronRight className="text-slate-600 shrink-0" size={20} />
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setMessageModal({
                        userId: role === 'customer' ? b.worker.id : b.customer.id,
                        bookingId: b.id,
                      })
                    }
                    className="text-sm px-4 py-2 rounded-xl border border-white/15 text-slate-200 hover:bg-white/10 font-medium"
                  >
                    Message
                  </button>

                  {role === 'worker' && b.status === 'requested' && (
                    <button type="button" onClick={() => updateStatus(b.id, 'accepted')} className="text-sm px-4 py-2 rounded-xl bg-green-600 text-white font-medium">
                      Accept
                    </button>
                  )}
                  {role === 'worker' && ['accepted', 'confirmed'].includes(b.status) && (
                    <button type="button" onClick={() => updateStatus(b.id, 'arriving')} className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">
                      On my way
                    </button>
                  )}
                  {role === 'worker' && ['arriving', 'accepted', 'confirmed'].includes(b.status) && (
                    <button type="button" onClick={() => updateStatus(b.id, 'started')} className="text-sm px-4 py-2 rounded-xl bg-purple-600 text-white font-medium">
                      Start work
                    </button>
                  )}
                  {role === 'worker' && b.status === 'started' && (
                    <button type="button" onClick={() => updateStatus(b.id, 'completed')} className="text-sm px-4 py-2 rounded-xl bg-teal-600 text-white font-medium">
                      Mark work complete
                    </button>
                  )}

                  {role === 'customer' && b.status === 'accepted' && (
                    <button type="button" onClick={() => updateStatus(b.id, 'confirmed')} className="text-sm px-4 py-2 rounded-xl bg-blue-600 text-white font-medium">
                      Confirm booking
                    </button>
                  )}
                  {role === 'customer' && b.status === 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewModal({
                            bookingId: b.id,
                            workerId: b.worker.id,
                            workerName: b.worker.name,
                          })
                        }
                        className="text-sm px-4 py-2 rounded-xl bg-amber-500 text-white font-medium flex items-center gap-1"
                      >
                        <Star size={14} /> Rate professional
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmTask(b.id)}
                        className="text-sm px-4 py-2 rounded-xl bg-teal-600 text-white font-medium flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Task completed
                      </button>
                    </>
                  )}
                  {role === 'customer' && b.status === 'completed' && (
                    <button type="button" onClick={() => setPaymentModal(b.id)} className="text-sm px-4 py-2 rounded-xl border border-amber-500/40 text-amber-300 font-medium">
                      Pay (Demo)
                    </button>
                  )}
                  {role === 'customer' && b.status === 'reviewed' && b.jobId && (
                    <button type="button" onClick={() => confirmTask(b.id)} className="text-sm px-4 py-2 rounded-xl border border-teal-500/40 text-teal-300 font-medium">
                      Close job request
                    </button>
                  )}
                </div>
              </AccountCard>
            ))}
          </div>
        )}
    </AccountPageShell>
  );
}
