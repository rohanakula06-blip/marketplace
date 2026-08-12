'use client';

import Link from 'next/link';
import { useAuthStore, useUIStore } from '@/store/app-store';

export function FinalCTA() {
  const user = useAuthStore((s) => s.user);
  const { setInfoModal } = useUIStore();
  const findWorkerHref = user ? (user.workerProfile ? '/find-workers' : '/dashboard/customer') : '/register';
  const findWorkHref = user ? (user.workerProfile ? '/dashboard/worker' : '/register/worker') : '/register/worker';

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-amber-900/20 to-teal-900/30" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 25% 50%, #2563eb 0%, transparent 40%), radial-gradient(circle at 75% 50%, #14b8a6 0%, transparent 40%)',
      }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
          Your Next Solution—or Your Next Opportunity—Is Nearby.
        </h2>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          Whether you need trusted help or want to offer your skills, LocalPro brings your neighbourhood together.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={findWorkerHref} className="btn-primary text-lg px-8 py-4">Find a Worker</Link>
          <Link href={findWorkHref} className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-4 text-lg font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all">Find Work</Link>
          <button onClick={() => setInfoModal('ai')} className="btn-gold text-lg px-8 py-4">Try AI Matching</button>
        </div>
      </div>
    </section>
  );
}
