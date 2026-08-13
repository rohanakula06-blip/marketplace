'use client';

import Link from 'next/link';
import { LogIn, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface LoginPortalCardsProps {
  className?: string;
  compact?: boolean;
  dark?: boolean;
  variant?: 'default' | 'teak';
}

export function LoginPortalCards({ className, compact = false, dark = false, variant = 'default' }: LoginPortalCardsProps) {
  const { t } = useTranslation();
  const isTeak = variant === 'teak';

  return (
    <div className={cn('space-y-3', className)}>
      {!compact && (
        <p className={cn('text-sm text-center sm:text-left', dark ? 'text-slate-400' : isTeak ? 'text-teak-600' : 'text-slate-500')}>
          {t('dashboard.alreadyAccount')}
        </p>
      )}
      <div className={cn('grid gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
        <Link
          href="/login"
          className={cn(
            'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
            dark
              ? 'border border-white/15 bg-white/5 backdrop-blur-sm hover:border-blue-400/40 hover:bg-white/10 hover:-translate-y-0.5'
              : isTeak
                ? 'border border-teak-200 bg-teak-50/80 hover:border-teak-400 hover:bg-teak-100 hover:shadow-md hover:-translate-y-0.5'
                : 'border-2 border-blue-200 bg-blue-50/80 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5'
          )}
        >
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white', isTeak ? 'bg-teak-600' : 'bg-blue-600')}>
            <User size={20} />
          </div>
          <div className="min-w-0 text-left">
            <p className={cn('font-semibold truncate', dark ? 'text-white group-hover:text-blue-300' : isTeak ? 'text-teak-900 group-hover:text-teak-700' : 'text-slate-900 group-hover:text-blue-700')}>
              {t('dashboard.loginUser')}
            </p>
            <p className={cn('text-xs truncate', dark ? 'text-slate-400' : isTeak ? 'text-teak-600' : 'text-slate-500')}>{t('dashboard.loginUserDesc')}</p>
          </div>
          <LogIn size={16} className={cn('ml-auto shrink-0 opacity-70 group-hover:opacity-100', dark ? 'text-blue-400' : isTeak ? 'text-teak-600' : 'text-blue-500')} />
        </Link>

        <Link
          href="/login/professional"
          className={cn(
            'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
            dark
              ? 'border border-white/15 bg-white/5 backdrop-blur-sm hover:border-teal-400/40 hover:bg-white/10 hover:-translate-y-0.5'
              : isTeak
                ? 'border border-teak-300 bg-white/70 hover:border-teak-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                : 'border-2 border-teal-200 bg-teal-50/80 hover:border-teal-400 hover:bg-teal-50 hover:shadow-md hover:-translate-y-0.5'
          )}
        >
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white', isTeak ? 'bg-teak-700' : 'bg-teal-600')}>
            <Briefcase size={20} />
          </div>
          <div className="min-w-0 text-left">
            <p className={cn('font-semibold truncate', dark ? 'text-white group-hover:text-teal-300' : isTeak ? 'text-teak-900 group-hover:text-teak-700' : 'text-slate-900 group-hover:text-teal-700')}>
              {t('dashboard.loginPro')}
            </p>
            <p className={cn('text-xs truncate', dark ? 'text-slate-400' : isTeak ? 'text-teak-600' : 'text-slate-500')}>{t('dashboard.loginProDesc')}</p>
          </div>
          <LogIn size={16} className={cn('ml-auto shrink-0 opacity-70 group-hover:opacity-100', dark ? 'text-teal-400' : isTeak ? 'text-teak-700' : 'text-teal-500')} />
        </Link>
      </div>
    </div>
  );
}
