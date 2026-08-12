'use client';

import { Shield, CheckCircle, Lock, Camera, DollarSign, AlertTriangle, UserCheck } from 'lucide-react';

const SAFETY_FEATURES = [
  { icon: UserCheck, title: 'Identity Document Verification' },
  { icon: CheckCircle, title: 'Skill & Qualification Verification' },
  { icon: Shield, title: 'Worker Profile Review' },
  { icon: CheckCircle, title: 'Verification Status Badges' },
  { icon: Lock, title: 'Private In-App Communication' },
  { icon: Shield, title: 'One-Time Arrival Confirmation Code' },
  { icon: Camera, title: 'Before & After Work Photos' },
  { icon: DollarSign, title: 'Clear Pricing Before Confirmation' },
  { icon: AlertTriangle, title: 'Report & Dispute Assistance' },
  { icon: Shield, title: 'Account Protection for All Users' },
  { icon: CheckCircle, title: 'Admin Moderation' },
];

export function SafetySection() {
  return (
    <section id="safety" className="section-padding section-dark bg-gradient-to-b from-[#0a0f1e] to-[#0c1222] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 mb-6 shadow-[0_0_40px_rgba(20,184,166,0.3)]">
            <Shield size={40} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trust Is Not Claimed. It Is Verified.</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">Every worker goes through verification. Every booking is protected.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY_FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 flex items-center gap-4 hover:border-teal-500/30 border border-transparent transition-all">
              <f.icon className="text-teal-400 shrink-0" size={22} />
              <span className="text-sm font-medium">{f.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
