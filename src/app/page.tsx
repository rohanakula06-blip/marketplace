'use client';

import { useAuthStore } from '@/store/app-store';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/hero/HeroSection';
import { LandingDashboard } from '@/components/sections/LandingDashboard';

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <main className="bg-teak-50">
      <Navbar />
      <HeroSection />
      {user && <LandingDashboard />}
      <Footer />
    </main>
  );
}
