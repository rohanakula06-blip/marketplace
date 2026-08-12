'use client';

import { Brain, Mic, Camera, Shield, Users, Briefcase, DollarSign, MessageSquare, Star } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'Problem Understanding', desc: 'AI analyses text, voice or a problem photograph.' },
  { icon: Briefcase, title: 'Service Classification', desc: 'Identifies whether you need an electrician, plumber, tutor or another professional.' },
  { icon: Shield, title: 'Urgency Detection', desc: 'Identifies dangerous requests and displays immediate safety guidance.' },
  { icon: Users, title: 'Smart Worker Matching', desc: 'Recommends workers using skill, distance, availability, experience and ratings.' },
  { icon: Briefcase, title: 'Smart Job Matching', desc: 'Workers receive job recommendations based on skills, location and availability.' },
  { icon: DollarSign, title: 'Fair-Price Guidance', desc: 'Suggested price range using service category and job details.' },
  { icon: Star, title: 'Review Summarisation', desc: 'Summarises common feedback without hiding original reviews.' },
  { icon: MessageSquare, title: 'Message Assistance', desc: 'Helps customers describe problems and workers write professional applications.' },
];

const PIPELINE = ['Describe or Upload', 'AI Understands', 'AI Classifies', 'AI Matches', 'Users Connect'];

export function AIFeatures() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-center mb-4">AI That Works For You</h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Practical AI built into every step — not a decorative chatbot</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 hover:border-amber-500/30 border border-transparent transition-all hover:-translate-y-1">
              <f.icon className="text-amber-400 mb-3" size={24} />
              <h4 className="font-semibold mb-2">{f.title}</h4>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <h3 className="text-center font-semibold text-slate-900 mb-8">AI Pipeline</h3>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {PIPELINE.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="glass px-5 py-3 rounded-xl text-sm font-medium text-center min-w-[120px]">
                  {step}
                </div>
                {i < PIPELINE.length - 1 && <span className="text-amber-400 hidden sm:inline">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
