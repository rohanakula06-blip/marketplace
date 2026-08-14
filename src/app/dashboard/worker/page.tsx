'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AccountPageShell,
  AccountCard,
  DashboardHero,
  DashboardSection,
  StatTile,
} from '@/components/account/AccountPageShell';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { MapPin, Clock, Briefcase, Loader2, Wifi, WifiOff, Calendar, User, MessageSquare } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import { resolveSearchCoords } from '@/lib/location-service';
import { BOOKING_STATUS_LABELS, formatBookingDateTime } from '@/lib/booking-utils';
import { cn } from '@/lib/utils';

interface WorkerBooking {
  id: string;
  service: string;
  description: string | null;
  date: string;
  time: string;
  price: string;
  status: string;
  customer: { id: string; name: string };
}

export default function WorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authReady = useAuthStore((s) => s.authReady);
  const { showToast, setMessageModal } = useUIStore();
  const { coords, location, locationReady, initialized, syncCurrentLocation } = useDashboardLocation();
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [bookings, setBookings] = useState<WorkerBooking[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const profile = user?.workerProfile as { isAvailable?: boolean } | null;
    if (profile && typeof profile.isAvailable === 'boolean') {
      setAvailable(profile.isAvailable);
    }
  }, [user?.workerProfile]);

  const loadData = useCallback(async () => {
    if (!user || !initialized) return;
    setLoading(true);
    const searchCoords = (await resolveSearchCoords()) ?? coords;
    const results = await Promise.allSettled([
      api.jobs.list({ lat: searchCoords.lat, lng: searchCoords.lng, status: 'open' }),
      api.bookings.list('worker'),
    ]);
    if (results[0].status === 'fulfilled') setJobs(results[0].value.jobs || []);
    if (results[1].status === 'fulfilled') {
      setBookings((results[1].value.bookings || []) as unknown as WorkerBooking[]);
    }
    setLoading(false);
  }, [user, initialized, coords.lat, coords.lng]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace('/login/professional');
      return;
    }
    if (!user.workerProfile && user.role !== 'worker') {
      router.replace('/dashboard/customer');
      return;
    }
    loadData();
  }, [user, authReady, router, loadData]);

  const toggleAvailability = async () => {
    if (!user || toggling) return;
    setToggling(true);
    const next = !available;
    try {
      await api.workers.update(user.id, { isAvailable: next });
      setAvailable(next);
      const me = await api.auth.me();
      if (me.user) {
        setUser({ ...(me.user as object), location: null } as Parameters<typeof setUser>[0]);
      }
      showToast(
        next
          ? 'You are online — customers can find and book you'
          : 'You are offline — hidden from customer search',
        next ? 'success' : 'info'
      );
    } catch {
      showToast('Failed to update availability', 'error');
    } finally {
      setToggling(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const data = await api.bookings.update(id, { status });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...(data.booking as unknown as WorkerBooking) } : b))
      );
      showToast(`Booking updated: ${BOOKING_STATUS_LABELS[status] || status}`, 'success');
      if (status === 'completed') loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update booking', 'error');
    }
  };

  if (!authReady) return <AccountPageShell variant="worker" loading />;
  if (!user) return null;

  const profile = user.workerProfile as { category?: string; rating?: number; completedJobs?: number } | null;
  const activeBookings = bookings.filter(
    (b) => !['reviewed', 'cancelled', 'paid'].includes(b.status)
  );
  const pendingRequests = bookings.filter((b) => b.status === 'requested');

  return (
    <AccountPageShell variant="worker">
      <DashboardHero
        variant="worker"
        name={user.name.split(' ')[0]}
        subtitle={`${profile?.category || 'Professional'} · LocalPro Pro`}
        badge="Professional Account"
        avatar={user.name.charAt(0)}
        location={locationReady ? location : undefined}
        onRefreshLocation={locationReady ? () => syncCurrentLocation(true).then(() => loadData()) : undefined}
        actions={
          <>
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={toggling}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                available
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/25 hover:bg-teal-500'
                  : 'bg-slate-800 text-slate-300 border border-white/15 hover:bg-slate-700'
              )}
            >
              {available ? <Wifi size={16} /> : <WifiOff size={16} />}
              {toggling ? 'Updating…' : available ? 'Online' : 'Go Online'}
            </button>
            <Link href="/find-jobs" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-white/15 text-slate-200 bg-slate-800/80 hover:bg-slate-700 whitespace-nowrap">
              Find Work
            </Link>
            <Link href="/bookings" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-white/15 text-slate-200 bg-slate-800/80 hover:bg-slate-700 whitespace-nowrap">
              All Bookings
            </Link>
          </>
        }
        banner={
          !available ? (
            <AccountCard className="px-4 py-3 text-sm text-amber-100/90 border-amber-500/20 bg-amber-500/10">
              You are hidden from customer search while offline. Turn online when ready to receive bookings.
            </AccountCard>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatTile icon={Calendar} label="Active bookings" value={activeBookings.length} accent="teal" />
        <StatTile icon={Briefcase} label="Pending requests" value={pendingRequests.length} accent="amber" />
        <StatTile icon={User} label="Jobs completed" value={profile?.completedJobs ?? 0} accent="blue" />
        <StatTile icon={Clock} label="Rating" value={`${profile?.rating ?? 0}★`} accent="yellow" />
      </div>

      <DashboardSection
        title="Booking Panel"
        icon={Calendar}
        accent="teal"
        action={
          <Link href="/bookings" className="text-sm text-teal-400 hover:text-teal-300 font-medium">
            Full panel →
          </Link>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8">
            <Loader2 size={18} className="animate-spin" /> Loading bookings…
          </div>
        ) : bookings.length === 0 ? (
          <AccountCard className="p-8 text-center text-slate-400">
            No bookings yet. Stay online so customers can find and book you.
          </AccountCard>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 8).map((b) => (
              <AccountCard key={b.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white capitalize">{b.service}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30 capitalize">
                        {BOOKING_STATUS_LABELS[b.status] || b.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Customer: {b.customer.name}</p>
                    {b.description && <p className="text-sm text-slate-500 mt-1">{b.description}</p>}
                  </div>
                  <p className="text-lg font-bold text-amber-400">{b.price}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatBookingDateTime(b.date, b.time)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setMessageModal({ userId: b.customer.id, bookingId: b.id })}
                    className="text-sm px-3 py-2 rounded-xl border border-white/15 text-slate-200 hover:bg-white/10 flex items-center gap-1"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                  {b.status === 'requested' && (
                    <button
                      type="button"
                      onClick={() => updateBookingStatus(b.id, 'accepted')}
                      className="text-sm px-4 py-2 rounded-xl bg-green-600 text-white font-medium"
                    >
                      Accept
                    </button>
                  )}
                  {['accepted', 'confirmed'].includes(b.status) && (
                    <button
                      type="button"
                      onClick={() => updateBookingStatus(b.id, 'arriving')}
                      className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium"
                    >
                      On my way
                    </button>
                  )}
                  {['arriving', 'accepted', 'confirmed'].includes(b.status) && (
                    <button
                      type="button"
                      onClick={() => updateBookingStatus(b.id, 'started')}
                      className="text-sm px-4 py-2 rounded-xl bg-purple-600 text-white font-medium"
                    >
                      Start work
                    </button>
                  )}
                  {b.status === 'started' && (
                    <button
                      type="button"
                      onClick={() => updateBookingStatus(b.id, 'completed')}
                      className="text-sm px-4 py-2 rounded-xl bg-teal-600 text-white font-medium"
                    >
                      Mark work complete
                    </button>
                  )}
                </div>
              </AccountCard>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Jobs Near You"
        icon={Briefcase}
        accent="teal"
        action={
          <Link href="/find-jobs" className="text-sm text-teal-400 hover:text-teal-300 font-medium">
            Browse all →
          </Link>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : jobs.length === 0 ? (
          <AccountCard className="p-8 text-center text-slate-400">
            No open customer requests nearby. Check back soon or widen your service area.
          </AccountCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.slice(0, 3).map((job) => (
              <AccountCard key={String(job.id)} hover className="p-5 flex flex-col">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{String(job.title)}</h4>
                  <p className="text-sm text-teal-400 capitalize mt-0.5">{String(job.category)}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                    <MapPin size={12} /> {String(job.distance ?? '?')} km · {String(job.date)} {String(job.time)}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{String(job.description)}</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <span className="text-amber-400 font-semibold">{String(job.budget)}</span>
                  <Link href="/find-jobs" className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500">
                    View & apply
                  </Link>
                </div>
              </AccountCard>
            ))}
          </div>
        )}
      </DashboardSection>
    </AccountPageShell>
  );
}
