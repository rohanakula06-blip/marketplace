'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, MapPin, Shield, Star, Lock, Users } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { resetLocationState } from '@/lib/location-service';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const NAV_LINKS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/find-workers', labelKey: 'nav.findWorkers' },
  { href: '/find-jobs', labelKey: 'nav.findJobs' },
  { href: '/contact', labelKey: 'nav.contact', modal: 'contact' as const },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { location, locationReady, setInfoModal } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const onLanding = pathname === '/';
  const isAuthRoute =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname === '/forgot-password' ||
    pathname?.startsWith('/reset-password') ||
    pathname === '/dashboard';
  const darkNav = (onLanding || isAuthRoute) && !scrolled;
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    resetLocationState();
    router.push('/');
  };

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      darkNav
        ? 'bg-slate-950/85 backdrop-blur-md py-4 border-b border-white/10 shadow-lg shadow-black/20'
        : scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-white/95 backdrop-blur-sm py-4 border-b border-slate-200'
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <MapPin size={18} className="text-white" fill="white" />
          </div>
          <span className={cn('text-xl font-bold tracking-tight', darkNav ? 'text-white' : 'text-blue-700')}>
            LocalPro
          </span>
        </Link>

        <div className={cn('hidden lg:flex items-center gap-6 text-sm font-medium', darkNav ? 'text-slate-100' : 'text-slate-700')}>
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.labelKey} type="button" onClick={() => setInfoModal(l.modal)} className={cn('transition-colors', darkNav ? 'hover:text-amber-300' : 'hover:text-blue-600')}>
                {t(l.labelKey)}
              </button>
            ) : (
              <Link key={l.href} href={l.href} className={cn('transition-colors', darkNav ? 'hover:text-amber-300' : 'hover:text-blue-600')}>{t(l.labelKey)}</Link>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {locationReady && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full',
              darkNav ? 'text-slate-100 bg-white/15' : 'text-slate-600 bg-slate-100'
            )}>
              <MapPin size={12} className={darkNav ? 'text-amber-400' : 'text-blue-600'} />
              <span className="max-w-[120px] truncate">{location.split(',')[0]}</span>
            </div>
          )}

          {user && <NotificationBell />}

          <div className="hidden lg:block">
            <LanguageSwitcher variant="nav" />
          </div>

          {user ? (
            <>
              <Link href="/bookings" className={cn('text-sm font-medium', darkNav ? 'text-slate-100 hover:text-white' : 'text-slate-700 hover:text-blue-600')}>{t('nav.myBookings')}</Link>
              <Link href="/messages" className={cn('text-sm font-medium', darkNav ? 'text-slate-100 hover:text-white' : 'text-slate-700 hover:text-blue-600')}>{t('nav.messages')}</Link>
              <Link
                href={user.workerProfile ? '/dashboard/worker' : '/dashboard/customer'}
                className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                {t('nav.myAccount')}
              </Link>
              <button onClick={handleLogout} className={cn('text-sm', darkNav ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')}>{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  'text-sm font-medium px-3 py-2 transition-colors',
                  darkNav ? 'text-white hover:text-amber-200' : 'text-slate-700 hover:text-blue-600'
                )}
              >
                {t('nav.loginUser')}
              </Link>
              <Link
                href="/login/professional"
                className={cn(
                  'text-sm font-semibold px-4 py-2 rounded-xl shadow-lg',
                  darkNav
                    ? 'text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/25'
                    : 'text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/20'
                )}
              >
                {t('nav.loginPro')}
              </Link>
            </>
          )}
        </div>

        <button className={cn('md:hidden', darkNav ? 'text-white' : 'text-slate-800')} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 mx-4 mt-2 rounded-2xl p-4 space-y-1 shadow-lg">
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.labelKey} type="button" onClick={() => { setInfoModal(l.modal); setMobileOpen(false); }} className="block w-full text-left py-2.5 text-slate-600 hover:text-blue-600 font-medium">
                {t(l.labelKey)}
              </button>
            ) : (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-slate-600 hover:text-blue-600 font-medium">{t(l.labelKey)}</Link>
            )
          )}
          <div className="py-3 border-t border-slate-100 mt-2">
            <LanguageSwitcher variant="footer" />
          </div>
          {user ? (
            <Link
              href={user.workerProfile ? '/dashboard/worker' : '/dashboard/customer'}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center btn-primary mt-2"
            >
              {t('nav.myAccount')}
            </Link>
          ) : (
            <div className="pt-2 space-y-2 border-t border-slate-100 mt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl border border-blue-200 text-blue-700 font-medium hover:bg-blue-50"
              >
                {t('nav.loginUser')}
              </Link>
              <Link
                href="/login/professional"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-500"
              >
                {t('nav.loginPro')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export function TrustBar() {
  const items = [
    { icon: Shield, title: 'Verified Professionals', desc: 'Background checked for your safety' },
    { icon: Star, title: 'Quality Work', desc: 'Top-rated by your community' },
    { icon: MapPin, title: 'Local & Nearby', desc: 'Find services close to you' },
    { icon: Lock, title: 'Safe & Secure', desc: 'Secure payments and data protection' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-3xl">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3 bg-white/70 backdrop-blur rounded-xl p-4 border border-white/80 shadow-sm">
          <div className="p-2 rounded-lg bg-blue-50">
            <item.icon size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsBar() {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 p-6 mt-10 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { icon: Users, value: '12K+', label: 'Happy Customers' },
          { icon: Shield, value: '4.5K+', label: 'Skilled Professionals' },
          { icon: Star, value: '25K+', label: 'Completed Jobs' },
          { icon: MapPin, value: '4.8', label: 'Average Rating' },
        ].map((s) => (
          <div key={s.label}>
            <s.icon className="mx-auto text-blue-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400 mt-4">Trusted local services marketplace</p>
    </div>
  );
}
