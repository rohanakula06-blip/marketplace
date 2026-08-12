'use client';

import Link from 'next/link';
import { Search, CheckCircle } from 'lucide-react';
import { ActionCards } from './ActionCards';
import { LocationPicker } from '../location/LocationPicker';
import { TrustBar, StatsBar } from '../layout/Navbar';
import { useAuthStore } from '@/store/app-store';

export function HeroSection() {
  const user = useAuthStore((s) => s.user);
  const findWorkersHref = user
    ? user.workerProfile
      ? '/find-workers'
      : '/dashboard/customer'
    : '/register';

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
      {/* Suburban street background — matches reference mockup */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-background.png')" }}
      />

      {/* Light wash + golden-hour glow for readable text on the left */}
      <div className="absolute inset-0 z-[1] hero-overlay" />
      <div className="absolute inset-0 z-[1] hero-golden-glow" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-50/90 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-100 shadow-sm">
            <CheckCircle size={16} />
            Trusted by thousands in your community
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.15] text-slate-900 mb-6">
            Local Skills. Local Needs.{' '}
            <span className="text-blue-600 block sm:inline">One Powerful Connection.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
            Whether you need a helping hand or are looking for meaningful work, LocalPro connects you with trusted people nearby.
          </p>

          <ActionCards />

          <TrustBar />
        </div>

        <StatsBar />

        {/* Location picker */}
        <div className="max-w-3xl mt-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            📍 Set Your Location
          </h3>
          <p className="text-sm text-slate-500 mb-4">Use GPS or search to find verified professionals near you</p>
          <LocationPicker showMap compact />
          <div className="mt-4">
            <Link href={findWorkersHref} className="btn-primary inline-flex items-center gap-2">
              <Search size={16} /> Find Nearby Professionals
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
