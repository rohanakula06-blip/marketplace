'use client';

import { cn } from '@/lib/utils';

export function LandingCard({
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
        'rounded-2xl landing-card',
        hover && 'transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

export function LandingStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <LandingCard className="p-5">
      <div className="inline-flex p-2.5 rounded-xl border border-teak-200 bg-teak-100 mb-3">
        <Icon size={20} className="text-teak-600" />
      </div>
      <p className="text-2xl font-bold text-teak-900 tabular-nums">{value}</p>
      <p className="text-sm text-teak-600 mt-0.5">{label}</p>
    </LandingCard>
  );
}

export function LandingSection({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-teak-600" />}
          <h2 className="text-lg font-semibold text-teak-900">{title}</h2>
          <div className="hidden sm:block h-px w-16 bg-gradient-to-r from-teak-400/60 to-transparent" />
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
