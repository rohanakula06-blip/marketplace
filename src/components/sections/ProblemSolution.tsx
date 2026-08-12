'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const CUSTOMER_PROBLEMS = [
  'Difficulty finding trusted local workers',
  'Uncertainty about worker skills and charges',
  'No simple way to compare availability',
  'Difficulty explaining technical problems',
  'Unreliable word-of-mouth contacts',
];

const WORKER_PROBLEMS = [
  'Irregular job opportunities',
  'Limited visibility outside their neighbourhood',
  'Difficulty building a trusted reputation',
  'No organised system for receiving local work',
  'Delayed or uncertain payments',
];

export function ProblemSolution() {
  const sectionRef = useRef<HTMLElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !bridgeRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.problem-left', { x: -80, opacity: 0, scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' } });
      gsap.from('.problem-right', { x: 80, opacity: 0, scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' } });
      gsap.from(bridgeRef.current, {
        scaleX: 0, opacity: 0,
        scrollTrigger: { trigger: bridgeRef.current, start: 'top 80%' },
        transformOrigin: 'center',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding section-dark bg-[#0c1222]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2 mb-16">
          <div className="problem-left glass rounded-2xl p-8">
            <h3 className="text-xl font-bold text-blue-700 mb-6">Customer Problems</h3>
            <ul className="space-y-4">
              {CUSTOMER_PROBLEMS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-slate-700">
                  <span className="text-red-400 mt-1">✕</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="problem-right glass rounded-2xl p-8">
            <h3 className="text-xl font-bold text-teal-700 mb-6">Worker Problems</h3>
            <ul className="space-y-4">
              {WORKER_PROBLEMS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-slate-700">
                  <span className="text-red-400 mt-1">✕</span>{p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={bridgeRef} className="relative py-16 text-center">
          <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-teal-500 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
          <div className="relative glass-strong inline-block rounded-2xl px-10 py-8">
            <h2 className="text-3xl font-bold gradient-text mb-4">One platform. Two opportunities.</h2>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-blue-700 font-semibold mb-1">For Customers</p>
                <p className="text-slate-600">Get reliable help when you need it.</p>
              </div>
              <div>
                <p className="text-teal-600 font-semibold mb-1">For Workers</p>
                <p className="text-slate-600">Find nearby work when you need it.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
