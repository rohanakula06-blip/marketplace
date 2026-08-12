'use client';

import { BOOKING_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function BookingTracker() {
  const currentStep = 4;

  return (
    <section className="section-padding section-dark bg-[#0c1222]">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-8">Booking Lifecycle</h2>
        <div className="glass-strong rounded-2xl p-8">
          <div className="flex overflow-x-auto gap-2 pb-4">
            {BOOKING_STATUSES.map((status, i) => (
              <div key={status} className="flex flex-col items-center min-w-[80px]">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all',
                  i <= currentStep ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-slate-200 text-slate-600'
                )}>
                  {i <= currentStep ? '✓' : i + 1}
                </div>
                <span className={cn('text-xs text-center capitalize', i <= currentStep ? 'text-teal-300' : 'text-slate-400')}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
