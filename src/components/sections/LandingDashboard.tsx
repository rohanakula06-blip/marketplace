'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { LandingCard, LandingStat, LandingSection } from '@/components/landing/LandingUi';
import { useAuthStore, useUIStore } from '@/store/app-store';
import {
  Star,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Search,
  Clock,
  Sparkles,
  Shield,
  MessageSquare,
  Info,
  Mail,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveSearchCoords } from '@/lib/location-service';
import { cn } from '@/lib/utils';

const EXPLORE_ITEMS = [
  { id: 'ai' as const, icon: Sparkles, label: 'Ask AI' },
  { id: 'features' as const, icon: Sparkles, label: 'AI Features' },
  { id: 'about' as const, icon: Info, label: 'About Us' },
  { id: 'safety' as const, icon: Shield, label: 'Safety' },
  { id: 'messaging' as const, icon: MessageSquare, label: 'Messaging' },
  { id: 'booking' as const, icon: Calendar, label: 'Bookings' },
  { id: 'contact' as const, icon: Mail, label: 'Contact' },
];

export function LandingDashboard() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { setWorkerProfileModal, setBookingModal, setInfoModal, coords } = useUIStore();
  const { t } = useTranslation();
  const isPro = !!user?.workerProfile;

  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const searchCoords = (await resolveSearchCoords()) ?? coords;
      if (isPro) {
        const [jobsRes, bookingsRes] = await Promise.all([
          api.jobs.list({ lat: searchCoords.lat, lng: searchCoords.lng, status: 'open' }),
          api.bookings.list('worker'),
        ]);
        setJobs(jobsRes.jobs || []);
        setBookings(bookingsRes.bookings || []);
      } else {
        const [workersRes, bookingsRes] = await Promise.all([
          api.workers.list({ lat: searchCoords.lat, lng: searchCoords.lng, sort: 'best_match' }),
          api.bookings.list('customer'),
        ]);
        setWorkers(workersRes.workers || []);
        setBookings(bookingsRes.bookings || []);
      }
    } catch {
      /* preview */
    } finally {
      setLoading(false);
    }
  }, [user, isPro, coords.lat, coords.lng]);

  useEffect(() => {
    if (authReady && user) loadData();
  }, [authReady, user, loadData]);

  if (!authReady || !user) return null;

  const activeBookings = bookings.filter(
    (b) => !['reviewed', 'cancelled'].includes(String(b.status))
  );
  const profile = user.workerProfile as { category?: string; rating?: number; completedJobs?: number } | null;
  const dashboardHref = isPro ? '/dashboard/worker' : '/dashboard/customer';

  return (
    <section className="relative border-t border-teak-200 py-16 bg-teak-50">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center rounded-full border border-teak-300 bg-teak-100 px-3 py-1 text-xs font-medium text-teak-800 mb-4">
              {isPro ? 'Professional Dashboard' : 'Your Dashboard'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-teak-950">
              Welcome back,{' '}
              <span className="text-teak-700">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-teak-600 mt-2 max-w-lg">
              {isPro
                ? 'Manage jobs, bookings, and your availability from one place.'
                : 'Browse nearby professionals, track bookings, and post jobs.'}
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teak-600 text-teak-50 shadow-md shadow-teak-900/15 hover:bg-teak-700 transition-colors"
          >
            <LayoutDashboard size={16} />
            Open Full Dashboard
          </Link>
        </div>

        {isPro ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <LandingStat icon={Briefcase} label="Open jobs nearby" value={jobs.length} />
            <LandingStat icon={Calendar} label="Active bookings" value={activeBookings.length} />
            <LandingStat icon={Users} label="Jobs completed" value={profile?.completedJobs ?? 0} />
            <LandingStat icon={Clock} label="Rating" value={`${profile?.rating ?? 0}★`} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <LandingStat icon={Users} label="Nearby pros" value={workers.length} />
            <LandingStat icon={Calendar} label="Active bookings" value={activeBookings.length} />
            <LandingStat icon={Briefcase} label="Quick actions" value="3" />
            <LandingStat icon={Star} label="Top rated nearby" value={workers[0] ? String(workers[0].rating ?? '—') : '—'} />
          </div>
        )}

        {isPro ? (
          <LandingSection
            title="Jobs Near You"
            icon={Briefcase}
            action={
              <Link href="/find-jobs" className="text-sm text-teak-700 hover:text-teak-900 font-medium">
                Browse all →
              </Link>
            }
          >
            {loading ? (
              <LandingCard className="p-8 text-center text-teak-600 text-sm">Loading jobs…</LandingCard>
            ) : jobs.length === 0 ? (
              <LandingCard className="p-8 text-center text-teak-600 text-sm">
                No open jobs nearby right now. Check back soon.
              </LandingCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.slice(0, 3).map((job) => (
                  <LandingCard key={String(job.id)} hover className="p-5">
                    <h4 className="font-semibold text-teak-900">{String(job.title)}</h4>
                    <p className="text-sm text-teak-600 capitalize mt-0.5">{String(job.category)}</p>
                    <p className="text-xs text-teak-500 flex items-center gap-1 mt-2">
                      <MapPin size={12} /> {String(job.distance ?? '?')} km · {String(job.date)}
                    </p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-teak-200">
                      <span className="text-teak-800 font-semibold text-sm">{String(job.budget)}</span>
                      <Link href="/find-jobs" className="text-xs px-3 py-1.5 bg-teak-600 text-teak-50 rounded-lg hover:bg-teak-700">
                        View
                      </Link>
                    </div>
                  </LandingCard>
                ))}
              </div>
            )}
          </LandingSection>
        ) : (
          <LandingSection
            title="Nearby Professionals"
            icon={Users}
            action={
              <Link href="/find-workers" className="text-sm text-teak-700 hover:text-teak-900 font-medium">
                View all →
              </Link>
            }
          >
            {loading ? (
              <LandingCard className="p-8 text-center text-teak-600 text-sm">Loading professionals…</LandingCard>
            ) : workers.length === 0 ? (
              <LandingCard className="p-8 text-center text-teak-600 text-sm">
                No professionals near you yet. Try updating your location above.
              </LandingCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workers.slice(0, 3).map((w) => (
                  <LandingCard key={String(w.id)} hover className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-teak-900">{String(w.name)}</h4>
                        <p className="text-sm text-teak-600 capitalize">{String(w.category)}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-teak-100 border border-teak-200 px-2 py-1">
                        <Star size={12} className="text-teak-600 fill-teak-400" />
                        <span className="text-xs text-teak-800 font-medium">{String(w.rating)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-teak-500 flex items-center gap-1 mt-2">
                      <MapPin size={12} /> {String(w.distance)} km away
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setWorkerProfileModal(String(w.id))}
                        className="flex-1 text-xs py-2 rounded-lg border border-teak-300 text-teak-800 hover:bg-teak-50"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingModal(true, String(w.id))}
                        className="flex-1 text-xs py-2 rounded-lg bg-teak-600 text-teak-50 font-semibold hover:bg-teak-700"
                      >
                        Book
                      </button>
                    </div>
                  </LandingCard>
                ))}
              </div>
            )}
          </LandingSection>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {(isPro
            ? [
                { href: '/find-jobs', icon: Briefcase, title: 'Find Work', desc: 'Browse open job requests' },
                { href: '/bookings', icon: Calendar, title: 'My Bookings', desc: `${activeBookings.length} active` },
                { href: dashboardHref, icon: LayoutDashboard, title: 'Pro Settings', desc: 'Availability & profile' },
              ]
            : [
                { href: '/find-workers', icon: Search, title: 'Find Professionals', desc: `${workers.length} nearby` },
                { href: '/bookings', icon: Calendar, title: 'My Bookings', desc: `${activeBookings.length} active` },
                { href: dashboardHref, icon: Briefcase, title: 'Post a Job', desc: 'Get help from pros' },
              ]
          ).map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <LandingCard hover className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl border border-teak-200 bg-teak-100">
                  <item.icon size={20} className="text-teak-600" />
                </div>
                <div>
                  <p className="font-semibold text-teak-900 group-hover:text-teak-700 transition-colors">{item.title}</p>
                  <p className="text-xs text-teak-600">{item.desc}</p>
                </div>
              </LandingCard>
            </Link>
          ))}
        </div>

        <LandingSection title={t('explore.title')} icon={Sparkles}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {EXPLORE_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setInfoModal(item.id)} className="text-left">
                <LandingCard hover className="p-4 h-full">
                  <div className="inline-flex p-2 rounded-lg border border-teak-200 bg-teak-100 mb-3">
                    <item.icon size={18} className="text-teak-600" />
                  </div>
                  <p className="font-semibold text-sm text-teak-900">{item.label}</p>
                </LandingCard>
              </button>
            ))}
          </div>
        </LandingSection>
      </div>
    </section>
  );
}
