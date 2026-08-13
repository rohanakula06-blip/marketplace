'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AccountPageShell,
  AccountCard,
  accountInputClass,
  DashboardHero,
  DashboardSection,
  StatTile,
} from '@/components/account/AccountPageShell';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { Star, MapPin, Plus, Bell, Loader2, Briefcase, Search, Calendar, Users } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import { resolveSearchCoords } from '@/lib/location-service';
import {
  TIME_SLOTS,
  minBookingDate,
  defaultBookingDate,
  defaultBookingTime,
} from '@/lib/booking-utils';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { setWorkerProfileModal, setBookingModal, showToast } = useUIStore();
  const { coords, location, locationReady, initialized, syncCurrentLocation } = useDashboardLocation();
  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [myJobs, setMyJobs] = useState<Record<string, unknown>[]>([]);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [posting, setPosting] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: 'Need help with home repair',
    category: 'plumber',
    description: 'Describe the issue you need fixed',
    budget: '₹500–₹800',
    date: defaultBookingDate(),
    time: defaultBookingTime(),
    urgency: 'normal',
  });

  const loadData = useCallback(async () => {
    if (!user || !initialized) return;

    const searchCoords = (await resolveSearchCoords()) ?? coords;

    const results = await Promise.allSettled([
      api.workers.list({ lat: searchCoords.lat, lng: searchCoords.lng, sort: 'best_match' }),
      api.bookings.list('customer'),
      api.jobs.mine('all'),
      api.notifications.list(),
    ]);

    const [workersRes, bookingsRes, jobsRes, notifRes] = results;

    if (workersRes.status === 'fulfilled') setWorkers(workersRes.value.workers || []);
    else showToast('Could not load nearby workers', 'error');

    if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.bookings || []);
    if (jobsRes.status === 'fulfilled') setMyJobs(jobsRes.value.jobs || []);
    if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.notifications || []);

    if (results.every((r) => r.status === 'rejected')) {
      showToast('Failed to load dashboard data', 'error');
    }
  }, [user, initialized, coords.lat, coords.lng, locationReady, showToast]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.workerProfile) {
      router.replace('/dashboard/worker');
      return;
    }
    loadData();
  }, [user, authReady, router, loadData]);

  const postJob = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setPosting(true);
    try {
      await api.jobs.create({
        ...jobForm,
        location,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      showToast('Job posted! Workers can now see it on Find Jobs.', 'success');
      setShowJobForm(false);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login');
        showToast('Please log in to post a job', 'error');
      } else {
        showToast(err instanceof ApiError ? err.message : 'Failed to post job', 'error');
      }
    } finally {
      setPosting(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) => !['reviewed', 'cancelled'].includes(String(b.status))
  );

  if (!authReady) return <AccountPageShell variant="customer" loading />;
  if (!user) return null;

  return (
    <AccountPageShell variant="customer">
      <DashboardHero
        variant="customer"
        name={user.name.split(' ')[0]}
        subtitle="Find and book trusted local professionals"
        badge="User Account"
        avatar={user.name.charAt(0)}
        location={locationReady ? location : undefined}
        onRefreshLocation={locationReady ? () => syncCurrentLocation(true).then(() => loadData()) : undefined}
        actions={
          <>
            <Link
              href="/find-workers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-shadow"
            >
              <Search size={16} /> Find Professionals
            </Link>
            <Link
              href="/bookings"
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white bg-white/5 hover:bg-white/10"
            >
              My Bookings
            </Link>
            <button
              type="button"
              onClick={() => setShowJobForm((v) => !v)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-amber-400/30 text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 flex items-center gap-2"
            >
              <Plus size={16} /> {showJobForm ? 'Cancel' : 'Post a Job'}
            </button>
          </>
        }
        banner={
          notifications.length > 0 ? (
            <AccountCard className="px-4 py-3 flex items-center gap-2">
              <Bell size={18} className="text-amber-400 shrink-0" />
              <span className="text-sm text-slate-200">
                {String(notifications[0].title)}: {String(notifications[0].message)}
              </span>
            </AccountCard>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatTile icon={Users} label="Nearby pros" value={workers.length} accent="amber" />
        <StatTile icon={Calendar} label="Active bookings" value={activeBookings.length} accent="blue" />
        <StatTile icon={Briefcase} label="Posted jobs" value={myJobs.length} accent="teal" />
        <StatTile icon={Bell} label="Notifications" value={notifications.length} accent="yellow" />
      </div>

      {showJobForm && (
        <AccountCard className="p-6 mb-10">
          <form onSubmit={postJob} className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Post a New Job</h3>
            <input
              required
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              placeholder="Job title"
              className={accountInputClass}
            />
            <select
              value={jobForm.category}
              onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
              className={accountInputClass}
            >
              {['plumber', 'electrician', 'cleaning', 'carpenter', 'tutor'].map((c) => (
                <option key={c} value={c} className="bg-slate-900">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <textarea
              required
              value={jobForm.description}
              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              placeholder="Describe the work needed"
              className={`${accountInputClass} min-h-[80px]`}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                required
                value={jobForm.budget}
                onChange={(e) => setJobForm({ ...jobForm, budget: e.target.value })}
                placeholder="Budget e.g. ₹500–₹800"
                className={accountInputClass}
              />
              <select
                value={jobForm.urgency}
                onChange={(e) => setJobForm({ ...jobForm, urgency: e.target.value })}
                className={accountInputClass}
              >
                <option value="normal" className="bg-slate-900">Normal</option>
                <option value="same-day" className="bg-slate-900">Same Day</option>
                <option value="emergency" className="bg-slate-900">Emergency</option>
              </select>
              <input
                required
                type="date"
                min={minBookingDate()}
                value={jobForm.date}
                onChange={(e) => setJobForm({ ...jobForm, date: e.target.value })}
                className={accountInputClass}
              />
              <select
                required
                value={jobForm.time}
                onChange={(e) => setJobForm({ ...jobForm, time: e.target.value })}
                className={accountInputClass}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={posting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {posting && <Loader2 size={16} className="animate-spin" />}
              Publish Job
            </button>
          </form>
        </AccountCard>
      )}

      {myJobs.length > 0 && (
        <DashboardSection title="My Posted Jobs" icon={Briefcase} accent="amber">
          <div className="grid gap-3 md:grid-cols-2">
            {myJobs.map((job) => (
              <AccountCard key={String(job.id)} hover className="p-4">
                <p className="font-semibold text-white">{String(job.title)}</p>
                <p className="text-sm text-slate-400 capitalize">{String(job.category)} · {String(job.status)}</p>
                <p className="text-xs text-slate-500 mt-1">{String(job.date)} · {String(job.time)} · {String(job.budget)}</p>
                {String(job.status) === 'open' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.jobs.complete(String(job.id));
                        showToast('Job closed — no longer visible to professionals', 'success');
                        loadData();
                      } catch {
                        showToast('Failed to close job', 'error');
                      }
                    }}
                    className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
                  >
                    Mark as completed
                  </button>
                )}
              </AccountCard>
            ))}
          </div>
        </DashboardSection>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardSection
            title="Nearby Professionals"
            icon={Users}
            accent="amber"
            action={
              <Link href="/find-workers" className="text-sm text-amber-400 hover:text-amber-300 font-medium">
                View all →
              </Link>
            }
          >
            {workers.length === 0 ? (
              <AccountCard className="p-8 text-center text-slate-400 text-sm">
                {locationReady
                  ? 'No professionals registered near your location yet.'
                  : 'Detecting your location… nearby professionals will appear shortly.'}
              </AccountCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workers.slice(0, 4).map((w) => (
                  <AccountCard key={String(w.id)} hover className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-white">{String(w.name)}</h4>
                        <p className="text-sm text-slate-400 capitalize">{String(w.category)}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-200 font-medium">{String(w.rating)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                      <MapPin size={12} />{String(w.distance)} km away
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setWorkerProfileModal(String(w.id))}
                        className="flex-1 text-xs py-2 rounded-lg border border-white/15 text-slate-200 hover:bg-white/10"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingModal(true, String(w.id))}
                        className="flex-1 text-xs py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold"
                      >
                        Book
                      </button>
                    </div>
                  </AccountCard>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        <div>
          <DashboardSection title="Active Bookings" icon={Calendar} accent="amber">
            {bookings.length === 0 ? (
              <AccountCard className="p-6 text-center text-slate-400 text-sm">No active bookings</AccountCard>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <AccountCard key={String(b.id)} className="p-4">
                    <p className="font-medium capitalize text-white">{String(b.service)}</p>
                    <p className="text-xs text-slate-400">{String(b.date)} · {String(b.status)}</p>
                    <p className="text-sm text-amber-400 mt-1 font-semibold">{String(b.price)}</p>
                  </AccountCard>
                ))}
              </div>
            )}
            <Link href="/bookings" className="block text-center text-sm text-amber-400 hover:text-amber-300 mt-4 font-medium">
              View all bookings →
            </Link>
          </DashboardSection>
        </div>
      </div>
    </AccountPageShell>
  );
}
