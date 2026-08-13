'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AccountCard,
  DashboardSection,
  StatTile,
} from '@/components/account/AccountPageShell';
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
      if (isPro) {
        const [jobsRes, bookingsRes] = await Promise.all([
          api.jobs.list({ lat: coords.lat, lng: coords.lng, status: 'open' }),
          api.bookings.list('worker'),
        ]);
        setJobs(jobsRes.jobs || []);
        setBookings(bookingsRes.bookings || []);
      } else {
        const [workersRes, bookingsRes] = await Promise.all([
          api.workers.list({ lat: coords.lat, lng: coords.lng, sort: 'best_match' }),
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
  const gradient = isPro
    ? 'from-teal-300 via-teal-400 to-emerald-400'
    : 'from-amber-300 via-amber-400 to-orange-400';
  const badgeClass = isPro
    ? 'border-teal-400/30 bg-teal-500/10 text-teal-200'
    : 'border-amber-400/30 bg-amber-500/10 text-amber-200';

  return (
    <section className="relative border-t border-white/10 py-16">
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-4', badgeClass)}>
              {isPro ? 'Professional Dashboard' : 'Your Dashboard'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Welcome back,{' '}
              <span className={cn('text-transparent bg-clip-text bg-gradient-to-r', gradient)}>
                {user.name.split(' ')[0]}
              </span>
            </h2>
            <p className="text-slate-400 mt-2 max-w-lg">
              {isPro
                ? 'Manage jobs, bookings, and your availability from one place.'
                : 'Browse nearby professionals, track bookings, and post jobs.'}
            </p>
          </div>
          <Link
            href={dashboardHref}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-shadow',
              isPro
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
            )}
          >
            <LayoutDashboard size={16} />
            Open Full Dashboard
          </Link>
        </div>

        {isPro ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <StatTile icon={Briefcase} label="Open jobs nearby" value={jobs.length} accent="teal" />
            <StatTile icon={Calendar} label="Active bookings" value={activeBookings.length} accent="amber" />
            <StatTile icon={Users} label="Jobs completed" value={profile?.completedJobs ?? 0} accent="blue" />
            <StatTile icon={Clock} label="Rating" value={`${profile?.rating ?? 0}★`} accent="yellow" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <StatTile icon={Users} label="Nearby pros" value={workers.length} accent="amber" />
            <StatTile icon={Calendar} label="Active bookings" value={activeBookings.length} accent="blue" />
            <StatTile icon={Briefcase} label="Quick actions" value="3" accent="teal" />
            <StatTile icon={Star} label="Top rated nearby" value={workers[0] ? String(workers[0].rating ?? '—') : '—'} accent="yellow" />
          </div>
        )}

        {isPro ? (
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
              <AccountCard className="p-8 text-center text-slate-400 text-sm">Loading jobs…</AccountCard>
            ) : jobs.length === 0 ? (
              <AccountCard className="p-8 text-center text-slate-400 text-sm">
                No open jobs nearby right now. Check back soon.
              </AccountCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.slice(0, 3).map((job) => (
                  <AccountCard key={String(job.id)} hover className="p-5">
                    <h4 className="font-semibold text-white">{String(job.title)}</h4>
                    <p className="text-sm text-teal-400 capitalize mt-0.5">{String(job.category)}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                      <MapPin size={12} /> {String(job.distance ?? '?')} km · {String(job.date)}
                    </p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                      <span className="text-amber-400 font-semibold text-sm">{String(job.budget)}</span>
                      <Link href="/find-jobs" className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500">
                        View
                      </Link>
                    </div>
                  </AccountCard>
                ))}
              </div>
            )}
          </DashboardSection>
        ) : (
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
            {loading ? (
              <AccountCard className="p-8 text-center text-slate-400 text-sm">Loading professionals…</AccountCard>
            ) : workers.length === 0 ? (
              <AccountCard className="p-8 text-center text-slate-400 text-sm">
                No professionals near you yet. Try updating your location above.
              </AccountCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workers.slice(0, 3).map((w) => (
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
                      <MapPin size={12} /> {String(w.distance)} km away
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
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {(isPro
            ? [
                { href: '/find-jobs', icon: Briefcase, title: 'Find Work', desc: 'Browse open job requests', iconClass: 'text-teal-400', boxClass: 'bg-teal-500/15 border-teal-500/20' },
                { href: '/bookings', icon: Calendar, title: 'My Bookings', desc: `${activeBookings.length} active`, iconClass: 'text-amber-400', boxClass: 'bg-amber-500/15 border-amber-500/20' },
                { href: dashboardHref, icon: LayoutDashboard, title: 'Pro Settings', desc: 'Availability & profile', iconClass: 'text-blue-400', boxClass: 'bg-blue-500/15 border-blue-500/20' },
              ]
            : [
                { href: '/find-workers', icon: Search, title: 'Find Professionals', desc: `${workers.length} nearby`, iconClass: 'text-amber-400', boxClass: 'bg-amber-500/15 border-amber-500/20' },
                { href: '/bookings', icon: Calendar, title: 'My Bookings', desc: `${activeBookings.length} active`, iconClass: 'text-blue-400', boxClass: 'bg-blue-500/15 border-blue-500/20' },
                { href: dashboardHref, icon: Briefcase, title: 'Post a Job', desc: 'Get help from pros', iconClass: 'text-teal-400', boxClass: 'bg-teal-500/15 border-teal-500/20' },
              ]
          ).map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <AccountCard hover className="p-5 flex items-center gap-4">
                <div className={cn('p-3 rounded-xl border', item.boxClass)}>
                  <item.icon size={20} className={item.iconClass} />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-slate-200 transition-colors">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </AccountCard>
            </Link>
          ))}
        </div>

        <DashboardSection title={t('explore.title')} icon={Sparkles} accent={isPro ? 'teal' : 'amber'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {EXPLORE_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setInfoModal(item.id)} className="text-left">
                <AccountCard hover className="p-4 h-full">
                  <div className="inline-flex p-2 rounded-lg border border-white/15 bg-white/5 mb-3">
                    <item.icon size={18} className="text-amber-400" />
                  </div>
                  <p className="font-semibold text-sm text-white">{item.label}</p>
                </AccountCard>
              </button>
            ))}
          </div>
        </DashboardSection>
      </div>
    </section>
  );
}
