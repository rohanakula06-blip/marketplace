'use client';

import { useEffect, useState } from 'react';
import { X, Star, Shield, MessageCircle, Calendar } from 'lucide-react';
import { useUIStore } from '@/store/app-store';

export function WorkerProfileModal() {
  const { workerProfileModal, setWorkerProfileModal, setBookingModal, setMessageModal } = useUIStore();
  const [worker, setWorker] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (workerProfileModal) {
      fetch(`/api/workers/${workerProfileModal}`)
        .then((r) => r.json())
        .then((d) => setWorker(d.worker))
        .catch(() => setWorker(null));
    }
  }, [workerProfileModal]);

  if (!workerProfileModal || !worker) return workerProfileModal ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"><div className="text-slate-400">Loading...</div></div>
  ) : null;

  const user = worker.user as { name: string; location: string };
  const reviews = (worker.reviews as { rating: number; review: string; customerName: string }[]) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-strong rounded-2xl w-full max-w-2xl p-8 relative my-8">
        <button onClick={() => setWorkerProfileModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={20} /></button>

        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-3xl font-bold text-white">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              {worker.verificationStatus === 'verified' && <Shield className="text-teal-600" size={20} />}
            </div>
            <p className="text-teal-600 capitalize">{String(worker.category)}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span className="text-slate-900">{String(worker.rating)}</span>
              <span className="text-slate-500 text-sm">({String(worker.reviewCount)} reviews)</span>
            </div>
          </div>
        </div>

        <p className="text-slate-600 mb-4">{String(worker.bio || '')}</p>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div><span className="text-slate-500">Experience</span><p className="font-medium text-slate-900">{String(worker.experience)} years</p></div>
          <div><span className="text-slate-500">Pricing</span><p className="font-medium text-amber-600">{String(worker.pricing)}</p></div>
          <div><span className="text-slate-500">Languages</span><p className="font-medium text-slate-900">{String(worker.languages)}</p></div>
          <div><span className="text-slate-500">Completed Jobs</span><p className="font-medium text-slate-900">{String(worker.completedJobs)}</p></div>
        </div>

        {reviews.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 mb-3">Reviews</h4>
            {reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="glass rounded-xl p-4 mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(r.rating)].map((_, j) => <Star key={j} size={12} className="text-amber-500 fill-amber-500" />)}
                  <span className="text-xs text-slate-500 ml-2">{r.customerName}</span>
                </div>
                <p className="text-sm text-slate-600">{r.review}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setWorkerProfileModal(null); setMessageModal({ userId: workerProfileModal }); }}
            className="flex-1 glass py-3 rounded-xl flex items-center justify-center gap-2 text-slate-700 hover:bg-slate-100">
            <MessageCircle size={18} /> Message
          </button>
          <button onClick={() => { setWorkerProfileModal(null); setBookingModal(true, workerProfileModal); }}
            className="flex-1 btn-primary flex items-center justify-center gap-2">
            <Calendar size={18} /> Book Worker
          </button>
        </div>
      </div>
    </div>
  );
}
