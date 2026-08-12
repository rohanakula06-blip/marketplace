'use client';

import { useState } from 'react';
import { Search, Briefcase } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export function ActionCards({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const [hovered, setHovered] = useState<'customer' | 'worker' | null>(null);
  const { setAuthIntent } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const setJourney = useAuthStore((s) => s.setJourney);
  const router = useRouter();
  const { t } = useTranslation();
  const isHero = variant === 'hero';

  const handleClick = (journey: 'customer' | 'worker') => {
    setAuthIntent(journey);
    setJourney(journey);
    if (!user) {
      router.push(journey === 'customer' ? '/register' : '/register/worker');
      return;
    }
    if (journey === 'customer') {
      router.push('/find-workers');
    } else if (user.workerProfile) {
      router.push('/dashboard/worker');
    } else {
      router.push('/register/worker');
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
          isHero
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-1'
            : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-1',
          hovered === 'customer' && 'scale-[1.02]'
        )}
      >
        <div className={cn('p-3 rounded-xl', isHero ? 'bg-black/15' : 'bg-white/20')}>
          <Search size={24} />
        </div>
        <div>
          <p className="font-bold text-lg">{t('action.findWorker')}</p>
          <p className={cn('text-sm', isHero ? 'text-slate-800/80' : 'text-blue-100')}>{t('action.findWorkerDesc')}</p>
        </div>
      </button>

      <button
        onMouseEnter={() => setHovered('worker')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleClick('worker')}
        className={cn(
          'group flex-1 flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-300 text-left',
          isHero
            ? 'border-2 border-white/20 bg-white/10 text-white backdrop-blur-sm hover:border-amber-400/50 hover:bg-white/15 hover:-translate-y-1'
            : 'bg-white text-slate-800 border-2 border-slate-200 shadow-md hover:border-blue-300 hover:shadow-lg hover:-translate-y-1',
          hovered === 'worker' && 'scale-[1.02]'
        )}
      >
        <div className={cn('p-3 rounded-xl', isHero ? 'bg-white/10' : 'bg-blue-50')}>
          <Briefcase size={24} className={isHero ? 'text-amber-300' : 'text-blue-600'} />
        </div>
        <div>
          <p className="font-bold text-lg">{t('action.findWork')}</p>
          <p className={cn('text-sm', isHero ? 'text-slate-300' : 'text-slate-500')}>{t('action.findWorkDesc')}</p>
        </div>
      </button>
    </div>
  );
}
