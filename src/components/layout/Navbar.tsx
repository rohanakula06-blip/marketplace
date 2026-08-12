'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, MapPin, Shield, Star, Lock, Users } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/find-workers', label: 'Find Workers' },
  { href: '/find-jobs', label: 'Find Jobs' },
  { href: '/register/worker', label: 'For Workers' },
  { href: '/contact', label: 'Contact', modal: 'contact' as const },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { location, openAuth, setInfoModal } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/');
  };

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-white/70 backdrop-blur-sm py-4 border-b border-white/40'
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <MapPin size={18} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-blue-700 tracking-tight">LocalPro</span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.label} type="button" onClick={() => setInfoModal(l.modal)} className="hover:text-blue-600 transition-colors">
                {l.label}
              </button>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-blue-600 transition-colors">{l.label}</Link>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <MapPin size={12} className="text-blue-600" />
            <span className="max-w-[100px] truncate">{location.split(',')[0]}</span>
          </div>

          {user && <NotificationBell />}

          {user ? (
            <>
              <Link href="/bookings" className="text-sm text-slate-600 hover:text-blue-600 font-medium">My Bookings</Link>
              <Link href="/messages" className="text-sm text-slate-600 hover:text-blue-600 font-medium">Messages</Link>
              <Link href={user.workerProfile ? '/dashboard/worker' : '/dashboard/customer'} className="text-sm text-slate-600 hover:text-blue-600 font-medium">Dashboard</Link>
              <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => openAuth('login')} className="text-sm font-medium text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">Log In</button>
              <button onClick={() => openAuth('register')} className="btn-primary text-sm !py-2 !px-5">Sign Up</button>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-700" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 mx-4 mt-2 rounded-2xl p-4 space-y-1 shadow-lg">
          {NAV_LINKS.map((l) =>
            'modal' in l && l.modal ? (
              <button key={l.label} type="button" onClick={() => { setInfoModal(l.modal); setMobileOpen(false); }} className="block w-full text-left py-2.5 text-slate-600 hover:text-blue-600 font-medium">
                {l.label}
              </button>
            ) : (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-slate-600 hover:text-blue-600 font-medium">{l.label}</Link>
            )
          )}
          {!user && (
            <button onClick={() => { openAuth('register'); setMobileOpen(false); }} className="btn-primary w-full mt-2">Sign Up</button>
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
      <p className="text-center text-xs text-slate-400 mt-4">Trusted local services marketplace — demo data for hackathon</p>
    </div>
  );
}
