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
import { MapPin, Clock, Briefcase, Loader2, Wifi, WifiOff, Calendar, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';

export default function WorkerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authReady = useAuthStore((s) => s.authReady);
  const { showToast } = useUIStore();
  const { coords, location, locationReady, initialized, syncCurrentLocation } = useDashboardLocation();
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
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
    const results = await Promise.allSettled([
      api.jobs.list({ lat: coords.lat, lng: coords.lng, status: 'open' }),
      api.bookings.list('worker'),
    ]);
    if (results[0].status === 'fulfilled') setJobs(results[0].value.jobs || []);
    if (results[1].status === 'fulfilled') setBookings(results[1].value.bookings || []);
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

  if (!authReady) return <AccountPageShell variant="worker" loading />;
  if (!user) return null;

  const profile = user.workerProfile as { category?: string; rating?: number; completedJobs?: number } | null;
  const activeBookings = bookings.filter(
    (b) => !['reviewed', 'cancelled'].includes(String(b.status))
  );

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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                available
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400'
                  : 'bg-white/5 text-slate-300 border border-white/15 hover:bg-white/10'
              }`}
            >
              {available ? <Wifi size={18} /> : <WifiOff size={18} />}
              {toggling ? 'Updating…' : available ? 'Online' : 'Go Online'}
            </button>
            <Link href="/find-jobs" className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white bg-white/5 hover:bg-white/10">
              Find Work
            </Link>
            <Link href="/bookings" className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white bg-white/5 hover:bg-white/10">
              My Bookings
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
        <StatTile icon={Briefcase} label="Open jobs nearby" value={jobs.length} accent="teal" />
        <StatTile icon={Calendar} label="Active bookings" value={activeBookings.length} accent="amber" />
        <StatTile icon={User} label="Jobs completed" value={profile?.completedJobs ?? 0} accent="blue" />
        <StatTile icon={Clock} label="Rating" value={`${profile?.rating ?? 0}★`} accent="yellow" />
      </div>

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
            {jobs.map((job) => (
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

      {activeBookings.length > 0 && (
        <DashboardSection title="Upcoming Bookings" icon={Calendar} accent="teal">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeBookings.slice(0, 6).map((b) => (
              <AccountCard key={String(b.id)} className="p-4">
                <p className="font-medium capitalize text-white">{String(b.service)}</p>
                <p className="text-xs text-slate-400 mt-1">{String(b.date)} · {String(b.time)}</p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30 capitalize">
                  {String(b.status)}
                </span>
              </AccountCard>
            ))}
          </div>
          <Link href="/bookings" className="block text-center text-sm text-teal-400 hover:text-teal-300 mt-4 font-medium">
            Manage all bookings →
          </Link>
        </DashboardSection>
      )}
    </AccountPageShell>
  );
}
