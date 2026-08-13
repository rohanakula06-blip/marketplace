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
  const isSignInRoute =
    pathname?.startsWith('/login') ||
    pathname === '/dashboard';
  const isTeakPublicRoute =
    pathname?.startsWith('/register') ||
    pathname === '/forgot-password' ||
    pathname?.startsWith('/reset-password');
  const isDarkAppRoute =
    (pathname?.startsWith('/dashboard/') || pathname === '/bookings') && pathname !== '/dashboard';
  const landingNav = isTeakPublicRoute && !isSignInRoute;
  const darkNav = (onLanding || isSignInRoute || isDarkAppRoute) && !scrolled;
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
      landingNav
        ? scrolled
          ? 'bg-teak-50/95 backdrop-blur-md py-3 border-b border-teak-200 shadow-sm'
          : 'bg-teak-50/85 backdrop-blur-md py-4 border-b border-teak-200/70'
        : darkNav
          ? scrolled
            ? 'bg-slate-950/90 backdrop-blur-md py-3 border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-slate-950/85 backdrop-blur-md py-4 border-b border-white/10 shadow-lg shadow-black/20'
          : scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
            : 'bg-white/95 backdrop-blur-sm py-4 border-b border-slate-200'
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl shadow-md',
            landingNav ? 'bg-teak-600' : 'bg-blue-600'
          )}>
            <MapPin size={18} className="text-white" fill="white" />
          </div>
          <span className={cn(
            'text-xl font-bold tracking-tight',
            landingNav ? 'text-teak-900' : darkNav ? 'text-white' : 'text-blue-700'
          )}>
            LocalPro
          </span>
        </Link>

        <div className={cn(
          'hidden lg:flex items-center gap-6 text-sm font-medium',
          landingNav ? 'text-teak-800' : darkNav ? 'text-slate-100' : 'text-slate-700'
        )}>
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.labelKey} type="button" onClick={() => setInfoModal(l.modal)} className={cn('transition-colors', landingNav ? 'hover:text-teak-600' : darkNav ? 'hover:text-amber-300' : 'hover:text-blue-600')}>
                {t(l.labelKey)}
              </button>
            ) : (
              <Link key={l.href} href={l.href} className={cn('transition-colors', landingNav ? 'hover:text-teak-600' : darkNav ? 'hover:text-amber-300' : 'hover:text-blue-600')}>{t(l.labelKey)}</Link>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {locationReady && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full',
              landingNav ? 'text-teak-700 bg-teak-100' : darkNav ? 'text-slate-100 bg-white/15' : 'text-slate-600 bg-slate-100'
            )}>
              <MapPin size={12} className={landingNav ? 'text-teak-600' : darkNav ? 'text-amber-400' : 'text-blue-600'} />
              <span className="max-w-[120px] truncate">{location.split(',')[0]}</span>
            </div>
          )}

          {user && <NotificationBell />}

          <div className="hidden lg:block">
            <LanguageSwitcher variant="nav" />
          </div>

          {user ? (
            <>
              <Link href="/bookings" className={cn('text-sm font-medium', landingNav ? 'text-teak-800 hover:text-teak-600' : darkNav ? 'text-slate-100 hover:text-white' : 'text-slate-700 hover:text-blue-600')}>{t('nav.myBookings')}</Link>
              <Link href="/messages" className={cn('text-sm font-medium', landingNav ? 'text-teak-800 hover:text-teak-600' : darkNav ? 'text-slate-100 hover:text-white' : 'text-slate-700 hover:text-blue-600')}>{t('nav.messages')}</Link>
              <Link
                href={user.workerProfile ? '/dashboard/worker' : '/dashboard/customer'}
                className={cn(
                  'text-sm font-medium text-white px-4 py-2 rounded-xl',
                  user.workerProfile ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {user.workerProfile ? t('nav.proAccount') : t('nav.userAccount')}
              </Link>
              <button onClick={handleLogout} className={cn('text-sm', landingNav ? 'text-teak-600 hover:text-teak-800' : darkNav ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')}>{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  'text-sm font-medium px-4 py-2 rounded-xl transition-all',
                  darkNav
                    ? 'border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:border-amber-400/50 hover:bg-white/15'
                    : landingNav
                      ? 'text-teak-800 hover:text-teak-600'
                      : 'text-slate-700 hover:text-blue-600'
                )}
              >
                {t('nav.loginUser')}
              </Link>
              <Link
                href="/login/professional"
                className={cn(
                  'text-sm font-semibold px-4 py-2 rounded-xl shadow-lg transition-all',
                  darkNav
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400'
                    : landingNav
                      ? 'text-teak-50 bg-teak-600 hover:bg-teak-700 shadow-teak-900/15'
                      : 'text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/20'
                )}
              >
                {t('nav.loginPro')}
              </Link>
            </>
          )}
        </div>

        <button className={cn('md:hidden', landingNav ? 'text-teak-900' : darkNav ? 'text-white' : 'text-slate-800')} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className={cn(
          'md:hidden mx-4 mt-2 rounded-2xl p-4 space-y-1 shadow-lg border',
          darkNav
            ? 'bg-slate-900/95 border-white/10 backdrop-blur-xl'
            : 'bg-white border-slate-100'
        )}>
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.labelKey} type="button" onClick={() => { setInfoModal(l.modal); setMobileOpen(false); }} className={cn('block w-full text-left py-2.5 font-medium', darkNav ? 'text-slate-300 hover:text-amber-300' : 'text-slate-600 hover:text-blue-600')}>
                {t(l.labelKey)}
              </button>
            ) : (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={cn('block py-2.5 font-medium', darkNav ? 'text-slate-300 hover:text-amber-300' : 'text-slate-600 hover:text-blue-600')}>{t(l.labelKey)}</Link>
            )
          )}
          <div className={cn('py-3 border-t mt-2', darkNav ? 'border-white/10' : 'border-slate-100')}>
            <LanguageSwitcher variant="footer" />
          </div>
          {user ? (
            <Link
              href={user.workerProfile ? '/dashboard/worker' : '/dashboard/customer'}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block w-full text-center mt-2 py-2.5 rounded-xl font-medium text-white',
                user.workerProfile ? 'bg-teal-600 hover:bg-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900'
              )}
            >
              {user.workerProfile ? t('nav.proAccount') : t('nav.userAccount')}
            </Link>
          ) : (
            <div className={cn('pt-2 space-y-2 border-t mt-2', darkNav ? 'border-white/10' : 'border-slate-100')}>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block w-full text-center py-2.5 rounded-xl font-medium',
                  darkNav
                    ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                    : 'border border-blue-200 text-blue-700 hover:bg-blue-50'
                )}
              >
                {t('nav.loginUser')}
              </Link>
              <Link
                href="/login/professional"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block w-full text-center py-2.5 rounded-xl font-semibold',
                  darkNav
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20'
                    : 'bg-teal-600 text-white hover:bg-teal-500'
                )}
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
