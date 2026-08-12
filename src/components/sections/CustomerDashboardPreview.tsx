'use client';

import { useEffect, useState } from 'react';
import { Star, MapPin, MessageCircle, Calendar, Shield } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface Worker {
  id: string;
  name: string;
  category: string;
  skills: string[];
  experience: number;
  pricing: string;
  rating: number;
  reviewCount: number;
  distance: number;
  matchScore: number;
  isAvailable: boolean;
  verificationStatus: string;
  whyRecommended: string;
  languages: string[];
  completedJobs: number;
}

export function CustomerDashboardPreview() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('best_match');
  const { setWorkerProfileModal, setBookingModal, setMessageModal } = useUIStore();

  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (category) params.set('category', category);
    fetch(`/api/workers?${params}`)
      .then((r) => r.json())
      .then((d) => setWorkers(d.workers || []))
      .catch(() => {});
  }, [category, sort]);

  return (
    <section className="section-padding section-dark bg-[#0c1222]">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold mb-2">Customer Marketplace Preview</h2>
        <p className="text-slate-300 mb-8">Search, compare and book trusted local professionals</p>

        <div className="glass-strong rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap gap-3 mb-6">
            <input placeholder="Search services..." className="flex-1 min-w-[200px] input-light rounded-xl px-4 py-2.5 text-sm" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-light rounded-xl px-4 py-2.5 text-sm">
              <option value="">All Categories</option>
              {['electrician', 'plumber', 'tutor', 'cleaning', 'carpenter'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-light rounded-xl px-4 py-2.5 text-sm">
              <option value="best_match">Best Match</option>
              <option value="nearest">Nearest</option>
              <option value="rating">Top Rated</option>
              <option value="price">Price</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workers.slice(0, 6).map((w) => (
              <div key={w.id} className="glass rounded-xl p-5 hover:border-blue-500/30 border border-transparent transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center font-bold text-lg text-white">
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{w.name}</h4>
                      {w.verificationStatus === 'verified' && <Shield size={14} className="text-teal-400" />}
                    </div>
                    <p className="text-sm text-slate-500 capitalize">{w.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-400">{w.matchScore}% match</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{w.rating}</span>
                  <span className="text-xs text-slate-500">({w.reviewCount || w.completedJobs} jobs)</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{w.experience} yrs · {w.pricing}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <MapPin size={12} />{w.distance} km · {w.isAvailable ? 'Available' : 'Busy'}
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{w.whyRecommended}</p>
                <div className="flex gap-2">
                  <button onClick={() => setWorkerProfileModal(w.id)} className="flex-1 text-xs py-2 rounded-lg glass text-slate-700 hover:bg-slate-100">View Profile</button>
                  <button onClick={() => setMessageModal({ userId: w.id })} className="p-2 rounded-lg glass text-slate-700 hover:bg-slate-100"><MessageCircle size={14} /></button>
                  <button onClick={() => setBookingModal(true, w.id)} className="flex-1 text-xs py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium">Book Worker</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
