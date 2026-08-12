'use client';

import Link from 'next/link';
import { LANGUAGES } from '@/lib/constants';
import { useUIStore } from '@/store/app-store';

export function Footer() {
  const { setLanguage, setInfoModal } = useUIStore();

  return (
    <footer className="border-t border-white/10 bg-[#060912] section-padding">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 font-bold">LP</div>
              <span className="text-xl font-bold">LocalPro</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Where Customers Find Help and Skills Find Opportunity. A two-way local services marketplace connecting trusted professionals with nearby customers.
            </p>
            <p className="mt-4 text-xs text-amber-400/80 font-medium">🏆 AI Hackathon Project — Prototype Demo</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/find-workers" className="hover:text-white">Find Workers</a></li>
              <li><a href="/find-jobs" className="hover:text-white">Find Jobs</a></li>
              <li><a href="/register/worker" className="hover:text-white">Become a Worker</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><button type="button" onClick={() => setInfoModal('safety')} className="hover:text-white">Safety</button></li>
              <li><button type="button" onClick={() => setInfoModal('help')} className="hover:text-white">Help Centre</button></li>
              <li><button type="button" onClick={() => setInfoModal('contact')} className="hover:text-white">Contact</button></li>
              <li><button type="button" onClick={() => setInfoModal('privacy')} className="hover:text-white">Privacy Policy</button></li>
              <li><button type="button" onClick={() => setInfoModal('terms')} className="hover:text-white">Terms & Conditions</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Language</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLanguage(l.code)} className="glass px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100">{l.label}</button>
              ))}
            </div>
            <p className="text-sm text-slate-500">Team: LocalPro Hackathon Squad</p>
            <p className="text-sm text-slate-500 mt-1">GitHub: github.com/localpro-demo</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-500">
          © 2026 LocalPro. All demo data is for prototype purposes only.
        </div>
      </div>
    </footer>
  );
}
