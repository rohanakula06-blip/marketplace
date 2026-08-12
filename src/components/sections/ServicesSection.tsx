'use client';

import { useState } from 'react';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function ServicesSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="services" className="section-padding section-dark bg-[#0c1222]">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-center mb-4">Local Services Near You</h2>
        <p className="text-slate-300 text-center mb-12">Browse categories and find verified professionals</p>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {SERVICE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'glass rounded-2xl p-6 text-center cursor-pointer transition-all duration-300',
                'hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(37,99,235,0.15)]',
                hovered === cat.id && 'border border-blue-500/30'
              )}
            >
              <div className={cn(
                'text-4xl mb-4 transition-transform duration-500 inline-block',
                hovered === cat.id && 'scale-125 rotate-12'
              )}>
                {cat.icon}
              </div>
              <h4 className="font-semibold mb-1">{cat.name}</h4>
              <p className="text-xs text-teal-600 mb-3">{cat.workers} nearby</p>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Explore →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
