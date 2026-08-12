'use client';

import { useState } from 'react';
import { Search, Briefcase } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function ActionCards() {
  const [hovered, setHovered] = useState<'customer' | 'worker' | null>(null);
  const { openAuth, setAuthIntent } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setJourney = useAuthStore((s) => s.setJourney);
  const router = useRouter();

  const handleClick = (journey: 'customer' | 'worker') => {
    setAuthIntent(journey);
    setJourney(journey);
    if (user) {
      router.push(journey === 'customer' ? '/find-workers' : '/find-jobs');
    } else {
      openAuth('register', journey);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
      <button
        onMouseEnter={() => setHovered('customer')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleClick('customer')}
        className={cn(
          'group flex-1 flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-300 text-left',
          'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-1',
          hovered === 'customer' && 'scale-[1.02]'
        )}
      >
        <div className="p-3 rounded-xl bg-white/20">
          <Search size={24} />
        </div>
        <div>
          <p className="font-bold text-lg">Find a Worker</p>
          <p className="text-sm text-blue-100">Hire trusted professionals</p>
        </div>
      </button>

      <button
        onMouseEnter={() => setHovered('worker')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleClick('worker')}
        className={cn(
          'group flex-1 flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-300 text-left',
          'bg-white text-slate-800 border-2 border-slate-200 shadow-md hover:border-blue-300 hover:shadow-lg hover:-translate-y-1',
          hovered === 'worker' && 'scale-[1.02]'
        )}
      >
        <div className="p-3 rounded-xl bg-blue-50">
          <Briefcase size={24} className="text-blue-600" />
        </div>
        <div>
          <p className="font-bold text-lg">Find Work</p>
          <p className="text-sm text-slate-500">Discover local jobs</p>
        </div>
      </button>
    </div>
  );
}
