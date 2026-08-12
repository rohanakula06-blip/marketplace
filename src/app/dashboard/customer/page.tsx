'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { Star, MapPin, Plus, Bell, Loader2, Briefcase, Navigation } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';

export default function CustomerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { setWorkerProfileModal, setBookingModal, showToast } = useUIStore();
  const { coords, location, locationReady, syncing, initialized, syncCurrentLocation } = useDashboardLocation();
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
    date: '2026-08-15',
    time: '10:00 AM',
    urgency: 'normal',
  });

  const loadData = useCallback(async () => {
    if (!user || !initialized) return;

    const results = await Promise.allSettled([
      api.workers.list({ lat: coords.lat, lng: coords.lng, sort: 'best_match' }),
      api.bookings.list('customer'),
      api.jobs.mine('all'),
      api.notifications.list(),
    ]);

    const [workersRes, bookingsRes, jobsRes, notifRes] = results;

    if (workersRes.status === 'fulfilled') {
      setWorkers(workersRes.value.workers || []);
    } else {
      showToast('Could not load nearby workers', 'error');
    }

    if (bookingsRes.status === 'fulfilled') {
      setBookings(bookingsRes.value.bookings || []);
    }

    if (jobsRes.status === 'fulfilled') {
      setMyJobs(jobsRes.value.jobs || []);
    }

    if (notifRes.status === 'fulfilled') {
      setNotifications(notifRes.value.notifications || []);
    }

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed === results.length) {
      showToast('Failed to load dashboard data', 'error');
    }
  }, [user, initialized, coords.lat, coords.lng, showToast]);

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

  if (!authReady) {
    return (
      <div className="min-h-screen section-dark bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen section-dark bg-[#0a0f1e]">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Customer Dashboard</h1>
            <p className="text-slate-300">Welcome, {user.name}</p>
            {locationReady && (
              <button
                type="button"
                onClick={() => syncCurrentLocation(true).then(() => loadData())}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200"
              >
                <MapPin size={12} />
                {location}
                <Navigation size={11} className="opacity-70" aria-label="Refresh location" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/" className="glass px-4 py-2 rounded-xl text-sm text-slate-800 hover:bg-slate-100">
              ← Home
            </Link>
            <button
              onClick={() => setShowJobForm((v) => !v)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Post Job
            </button>
          </div>
        </div>

        {showJobForm && (
          <form onSubmit={postJob} className="glass rounded-2xl p-6 mb-8 space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">Post a New Job</h3>
            <input
              required
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              placeholder="Job title"
              className="w-full input-light rounded-xl px-4 py-3 text-sm"
            />
            <select
              value={jobForm.category}
              onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
              className="w-full input-light rounded-xl px-4 py-3 text-sm"
            >
              {['plumber', 'electrician', 'cleaning', 'carpenter', 'tutor'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <textarea
              required
              value={jobForm.description}
              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              placeholder="Describe the work needed"
              className="w-full input-light rounded-xl px-4 py-3 text-sm min-h-[80px]"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                required
                value={jobForm.budget}
                onChange={(e) => setJobForm({ ...jobForm, budget: e.target.value })}
                placeholder="Budget e.g. ₹500–₹800"
                className="input-light rounded-xl px-4 py-3 text-sm"
              />
              <select
                value={jobForm.urgency}
                onChange={(e) => setJobForm({ ...jobForm, urgency: e.target.value })}
                className="input-light rounded-xl px-4 py-3 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="same-day">Same Day</option>
                <option value="emergency">Emergency</option>
              </select>
              <input
                required
                type="date"
                value={jobForm.date}
                onChange={(e) => setJobForm({ ...jobForm, date: e.target.value })}
                className="input-light rounded-xl px-4 py-3 text-sm"
              />
              <input
                required
                value={jobForm.time}
                onChange={(e) => setJobForm({ ...jobForm, time: e.target.value })}
                placeholder="Time e.g. 10:00 AM"
                className="input-light rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <button type="submit" disabled={posting} className="btn-primary flex items-center gap-2">
              {posting && <Loader2 size={16} className="animate-spin" />}
              Publish Job
            </button>
          </form>
        )}

        {notifications.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-2">
            <Bell size={18} className="text-amber-500 shrink-0" />
            <span className="text-sm text-slate-800">
              {String(notifications[0].title)}: {String(notifications[0].message)}
            </span>
          </div>
        )}

        {myJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Briefcase size={18} /> My Posted Jobs ({myJobs.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {myJobs.map((job) => (
                <div key={String(job.id)} className="glass rounded-xl p-4">
                  <p className="font-semibold text-slate-900">{String(job.title)}</p>
                  <p className="text-sm text-slate-600 capitalize">{String(job.category)} · {String(job.status)}</p>
                  <p className="text-xs text-slate-500 mt-1">{String(job.date)} · {String(job.budget)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-semibold mb-4 text-white">Nearby Workers</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {workers.slice(0, 4).map((w) => (
                <div key={String(w.id)} className="glass rounded-xl p-5">
                  <h4 className="font-semibold text-slate-900">{String(w.name)}</h4>
                  <p className="text-sm text-slate-600 capitalize">{String(w.category)}</p>
                  <div className="flex items-center gap-1 my-2">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm text-slate-800">{String(w.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} />{String(w.distance)} km
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setWorkerProfileModal(String(w.id))}
                      className="flex-1 text-xs py-2 glass rounded-lg text-slate-800 hover:bg-slate-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setBookingModal(true, String(w.id))}
                      className="flex-1 text-xs py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-4 text-white">Active Bookings</h2>
            {bookings.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center text-slate-600 text-sm">No active bookings</div>
            ) : (
              bookings.map((b) => (
                <div key={String(b.id)} className="glass rounded-xl p-4 mb-3">
                  <p className="font-medium capitalize text-slate-900">{String(b.service)}</p>
                  <p className="text-xs text-slate-600">{String(b.date)} · {String(b.status)}</p>
                  <p className="text-sm text-amber-600 mt-1 font-semibold">{String(b.price)}</p>
                </div>
              ))
            )}
            <Link href="/bookings" className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-4">
              View all bookings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
