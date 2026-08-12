'use client';

import { Eye, Type, Keyboard, Wifi } from 'lucide-react';
import { useUIStore } from '@/store/app-store';

export function AccessibilitySection() {
  const { largeText, setLargeText, reducedMotion, setReducedMotion } = useUIStore();

  return (
    <section className="section-padding section-dark bg-[#060912]">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-center mb-8">Built for Everyone</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🎤', title: 'Voice Requests', desc: 'Speak your problem instead of typing' },
            { icon: '🌐', title: '3 Languages', desc: 'English, Hindi and Telugu' },
            { icon: '💵', title: 'Cash Payment', desc: 'Pay after service if preferred' },
            { icon: '⌨️', title: 'Keyboard Navigation', desc: 'Full keyboard accessibility' },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-5 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button onClick={() => setLargeText(!largeText)} className={`glass px-4 py-2 rounded-xl text-sm text-slate-700 flex items-center gap-2 ${largeText ? 'border border-amber-400' : ''}`}>
            <Type size={16} /> Large Text {largeText ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setReducedMotion(!reducedMotion)} className={`glass px-4 py-2 rounded-xl text-sm text-slate-700 flex items-center gap-2 ${reducedMotion ? 'border border-amber-400' : ''}`}>
            <Eye size={16} /> Reduced Motion {reducedMotion ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function AdminPreview() {
  const stats = [
    { label: 'Customers', value: '12+' },
    { label: 'Workers', value: '10+' },
    { label: 'Open Jobs', value: '2' },
    { label: 'Pending Verifications', value: '0' },
  ];

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-xl font-bold text-center mb-2 text-slate-700">Admin Dashboard Preview</h2>
        <div className="glass rounded-xl p-6 opacity-80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-400">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center">Customer & worker management · Verification · Moderation · Disputes</p>
        </div>
      </div>
    </section>
  );
}
