'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { MapPin, Clock, Briefcase, Loader2, Navigation } from 'lucide-react';
import { api } from '@/lib/api';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';

export default function WorkerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { openAuth, showToast } = useUIStore();
  const { coords, location, syncing, initialized, syncCurrentLocation } = useDashboardLocation();
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user || !initialized) return;
    setLoading(true);
    try {
      const jobsRes = await api.jobs.list({ lat: coords.lat, lng: coords.lng, status: 'open' });
      const bookingsRes = await api.bookings.list('worker');
      setJobs(jobsRes.jobs || []);
      setBookings(bookingsRes.bookings || []);
    } finally {
      setLoading(false);
    }
  }, [user, initialized, coords.lat, coords.lng]);

  useEffect(() => {
    if (!user) {
      openAuth('login', 'worker');
      return;
    }
    loadData();
  }, [user, openAuth, loadData]);

  const apply = async (jobId: string) => {
    try {
      await api.applications.create({
        jobId,
        proposedPrice: '₹650',
        message: 'Available to help!',
        estimatedArrival: '45 min',
      });
      showToast('Application submitted!', 'success');
    } catch {
      if (!user) openAuth('login', 'worker');
      else showToast('Application failed', 'error');
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    try {
      await api.workers.update(user.id, { isAvailable: !available });
      setAvailable(!available);
      showToast(`You are now ${!available ? 'online' : 'offline'}`, 'info');
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen section-dark bg-[#0a0f1e]">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Worker Dashboard</h1>
            <p className="text-slate-300">Welcome, {user.name}</p>
            <button
              type="button"
              onClick={() => syncCurrentLocation(false).then(() => loadData())}
              disabled={syncing}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200"
            >
              {syncing ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
              {location}
              {!syncing && <Navigation size={11} className="opacity-70" title="Refresh GPS" />}
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={toggleAvailability} className={`px-4 py-2 rounded-xl text-sm font-medium ${available ? 'bg-teal-600 text-white' : 'glass text-slate-800'}`}>
              {available ? '🟢 Online' : '⚫ Offline'}
            </button>
            <Link href="/" className="glass px-4 py-2 rounded-xl text-sm text-slate-800">← Home</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="glass rounded-xl p-5">
            <Briefcase className="text-teal-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-sm text-slate-600">Nearby Jobs</p>
          </div>
          <div className="glass rounded-xl p-5">
            <Clock className="text-amber-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
            <p className="text-sm text-slate-600">Confirmed Jobs</p>
          </div>
          <div className="glass rounded-xl p-5">
            <MapPin className="text-blue-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-900">15 km</p>
            <p className="text-sm text-slate-600">Service Radius</p>
          </div>
        </div>

        <h2 className="font-semibold mb-4 text-white">Recommended Jobs Near You</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8">
            <Loader2 size={18} className="animate-spin" /> Loading jobs for your location...
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-slate-600">No open jobs near {location} right now.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <div key={String(job.id)} className="glass rounded-xl p-5">
                <h4 className="font-semibold text-slate-900">{String(job.title)}</h4>
                <p className="text-sm text-teal-600 capitalize">{String(job.category)}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {String(job.distance ?? '?')} km away
                </p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{String(job.description)}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-amber-600 font-semibold">{String(job.budget)}</span>
                  <button onClick={() => apply(String(job.id))} className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500">Apply</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
