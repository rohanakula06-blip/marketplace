'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const CUSTOMER_STEPS = [
  { icon: '🔐', title: 'Login', desc: 'Sign in securely' },
  { icon: '🔍', title: 'Find a Worker', desc: 'Choose your path' },
  { icon: '🔎', title: 'Search Service', desc: 'Describe what you need' },
  { icon: '📍', title: 'Set Location', desc: 'Find nearby help' },
  { icon: '👷', title: 'View Workers', desc: 'Browse verified pros' },
  { icon: '⚖️', title: 'Compare', desc: 'Filter and sort' },
  { icon: '📋', title: 'View Profile', desc: 'Check credentials' },
  { icon: '💬', title: 'Message/Book', desc: 'Connect directly' },
  { icon: '✅', title: 'Confirmed', desc: 'Booking accepted' },
  { icon: '🔧', title: 'Service Done', desc: 'Work completed' },
  { icon: '💳', title: 'Payment', desc: 'Pay securely' },
  { icon: '⭐', title: 'Review', desc: 'Rate your experience' },
];

const WORKER_STEPS = [
  { icon: '🔐', title: 'Login', desc: 'Access your dashboard' },
  { icon: '💼', title: 'Find Work', desc: 'Browse nearby jobs' },
  { icon: '🗺️', title: 'View Jobs', desc: 'See opportunities' },
  { icon: '🔎', title: 'Filter Jobs', desc: 'Match your skills' },
  { icon: '📄', title: 'Job Details', desc: 'Review requirements' },
  { icon: '📝', title: 'Apply', desc: 'Submit proposal' },
  { icon: '📬', title: 'Customer Reviews', desc: 'Application received' },
  { icon: '✅', title: 'Selected', desc: 'You got the job' },
  { icon: '🔧', title: 'Perform Service', desc: 'Complete the work' },
  { icon: '✔️', title: 'Mark Complete', desc: 'Job finished' },
  { icon: '💰', title: 'Get Paid', desc: 'Receive payment' },
  { icon: '⭐', title: 'Get Reviewed', desc: 'Build reputation' },
];

export function JourneySection() {
  const [journey, setJourney] = useState<'customer' | 'worker'>('customer');
  const steps = journey === 'customer' ? CUSTOMER_STEPS : WORKER_STEPS;

  return (
    <section id="how-it-works" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose Your LocalPro Journey</h2>
        <p className="text-slate-600 text-center mb-10">Follow the connected pathway from start to finish</p>

        <div className="flex justify-center gap-4 mb-12">
          {(['customer', 'worker'] as const).map((j) => (
            <button
              key={j}
              onClick={() => setJourney(j)}
              className={cn(
                'px-8 py-3 rounded-xl font-semibold transition-all',
                journey === j
                  ? j === 'customer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'glass text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {j === 'customer' ? 'Customer Journey' : 'Worker Journey'}
            </button>
          ))}
        </div>

        <div className="relative overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max px-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center">
                {i < steps.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+40px)] w-[calc(100%-20px)] h-0.5 bg-gradient-to-r from-blue-500/50 to-teal-500/50 hidden sm:block" style={{ width: '80px' }} />
                )}
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform hover:scale-110',
                  journey === 'customer' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-teal-600/20 border border-teal-500/30'
                )}>
                  {step.icon}
                </div>
                <h4 className="font-semibold text-sm text-center w-24 text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-500 text-center w-24 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
