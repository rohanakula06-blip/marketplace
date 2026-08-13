'use client';

import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';

interface AccountPageShellProps {
  children?: React.ReactNode;
  variant?: 'customer' | 'worker';
  loading?: boolean;
}

export function AccountPageShell({
  children,
  variant = 'customer',
  loading = false,
}: AccountPageShellProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060912] flex items-center justify-center">
        <Loader2
          size={32}
          className={cn('animate-spin', variant === 'worker' ? 'text-teal-400' : 'text-amber-400')}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060912]">
      <div className="absolute inset-0 hero-dark-ambient pointer-events-none" />

      <Navbar />

      <div className="relative z-10 pt-24 pb-16 mx-auto max-w-7xl px-4 lg:px-8">{children}</div>
    </div>
  );
}

/** Landing-style glass card for account pages */
export function AccountCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl glass-card shadow-lg shadow-black/20',
        hover && 'transition-all duration-300 hover:border-white/25 hover:bg-white/10',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DashboardSection({
  title,
  icon: Icon,
  accent = 'amber',
  action,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: 'amber' | 'teal';
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const accentClass = accent === 'teal' ? 'text-teal-400' : 'text-amber-400';
  const lineClass = accent === 'teal' ? 'from-teal-500/60' : 'from-amber-500/60';

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className={accentClass} />}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <div className={cn('hidden sm:block h-px w-16 bg-gradient-to-r to-transparent', lineClass)} />
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = 'amber',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: 'amber' | 'teal' | 'blue' | 'yellow';
}) {
  const colors = {
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20' },
    teal: { text: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/20' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/20' },
  };
  const { text, bg } = colors[accent];

  return (
    <AccountCard className="p-5">
      <div className={cn('inline-flex p-2.5 rounded-xl border mb-3', bg)}>
        <Icon size={20} className={text} />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </AccountCard>
  );
}

export function DashboardHero({
  variant,
  name,
  subtitle,
  badge,
  avatar,
  location,
  onRefreshLocation,
  actions,
  banner,
}: {
  variant: 'customer' | 'worker';
  name: string;
  subtitle: string;
  badge: string;
  avatar: string;
  location?: string;
  onRefreshLocation?: () => void;
  actions: React.ReactNode;
  banner?: React.ReactNode;
}) {
  const isPro = variant === 'worker';
  const gradient = isPro
    ? 'from-teal-300 via-teal-400 to-emerald-400'
    : 'from-amber-300 via-amber-400 to-orange-400';
  const badgeClass = isPro
    ? 'border-teal-400/30 bg-teal-500/10 text-teal-200'
    : 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  const avatarClass = isPro
    ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/25'
    : 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-900 shadow-amber-500/25';
  const locClass = isPro ? 'text-teal-300/90 hover:text-teal-200' : 'text-amber-300/90 hover:text-amber-200';

  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-4 backdrop-blur-sm">
        <span className={cn('rounded-full border px-3 py-1', badgeClass)}>{badge}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
            Welcome back,{' '}
            <span className={cn('text-transparent bg-clip-text bg-gradient-to-r', gradient)}>{name}</span>
          </h1>
          <p className="text-slate-400">{subtitle}</p>
          {location && onRefreshLocation && (
            <button
              type="button"
              onClick={onRefreshLocation}
              className={cn('mt-2 inline-flex items-center gap-1.5 text-xs', locClass)}
            >
              <MapPin size={12} />
              {location}
            </button>
          )}
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-lg">
          <div className={cn('flex h-full w-full items-center justify-center rounded-2xl', avatarClass)}>
            {avatar}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">{actions}</div>
      {banner}
    </div>
  );
}

export const accountInputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30';

export const accountInputClassPro =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30';
