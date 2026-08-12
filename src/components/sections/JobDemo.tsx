'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function JobDemo() {
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Customer Posts Job', content: 'Kitchen tap is leaking', details: ['Category: Plumbing', 'Location: Banjara Hills', 'Budget: ₹500–₹800', 'Priority: Same-day'] },
    { title: 'Job Appears on Worker Dashboards', content: 'Nearby plumbers receive notification', details: ['2.3 km away', '3 plumbers notified', 'Urgency: Same-day'] },
    { title: 'Worker Submits Application', content: 'Suresh Reddy applies', details: ['Proposed price: ₹650', 'Available: 2–6 PM today', 'ETA: 45 minutes', 'Message: Can fix today with parts'] },
    { title: 'Customer Compares & Selects', content: 'Priya reviews applications', details: ['Compare price & ratings', 'Check availability', 'Select best match'] },
  ];

  return (
    <section className="section-padding section-dark bg-[#0c1222]">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-2">Job Posting & Application Demo</h2>
        <p className="text-slate-300 text-center mb-10">See how customers and workers connect in real time</p>

        <div className="glass-strong rounded-2xl p-8">
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className={`w-3 h-3 rounded-full transition-all ${i === step ? 'bg-amber-500 w-8' : 'bg-slate-300'}`} />
            ))}
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-amber-600 mb-2">{steps[step].title}</h3>
            <p className="text-2xl font-semibold text-slate-900 mb-4">&ldquo;{steps[step].content}&rdquo;</p>
            <ul className="space-y-2">
              {steps[step].details.map((d) => (
                <li key={d} className="text-slate-600">{d}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="glass px-4 py-2 rounded-xl text-slate-700 disabled:opacity-30">Previous</button>
            <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1} className="btn-primary flex items-center gap-2 disabled:opacity-30">
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
