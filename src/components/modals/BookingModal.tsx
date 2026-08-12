'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

export function BookingModal() {
  const { bookingModal, selectedWorkerId, setBookingModal, showToast, openAuth } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [worker, setWorker] = useState<{ name: string; category: string; pricing: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service: '', description: '', date: '', time: '', address: '', urgency: 'normal', price: '',
  });

  useEffect(() => {
    if (selectedWorkerId) {
      api.workers.get(selectedWorkerId).then((d) => {
        const w = d.worker as { user: { name: string }; category: string; pricing: string };
        setWorker({ name: w.user.name, category: w.category, pricing: w.pricing });
        setForm((f) => ({ ...f, service: w.category, price: w.pricing }));
      }).catch(() => {});
    }
  }, [selectedWorkerId]);

  if (!bookingModal) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuth('login', 'customer'); return; }
    setLoading(true);
    try {
      await api.bookings.create({ ...form, workerId: selectedWorkerId });
      showToast('Booking request sent! The professional will be notified.', 'success');
      setBookingModal(false);
      router.push('/bookings');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-8 relative my-8 shadow-2xl">
        <button onClick={() => setBookingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={20} /></button>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Book Worker</h2>
        {worker && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">{worker.name.charAt(0)}</div>
            <div>
              <p className="font-semibold text-slate-900">{worker.name}</p>
              <p className="text-sm text-slate-500 capitalize">{worker.category} · {worker.pricing}</p>
            </div>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <textarea placeholder="Describe the problem" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full input-light rounded-xl px-4 py-3 text-sm min-h-[80px]" required />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full input-light rounded-xl px-4 py-3 text-sm" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-light rounded-xl px-4 py-3 text-sm" required />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="input-light rounded-xl px-4 py-3 text-sm" required />
          </div>
          <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            className="w-full input-light rounded-xl px-4 py-3 text-sm">
            <option value="normal">Normal</option>
            <option value="same-day">Same Day</option>
            <option value="emergency">Emergency</option>
          </select>
          <div className="glass rounded-xl p-4 text-sm">
            <p className="text-slate-600">Estimated price: <span className="text-amber-600 font-semibold">{form.price || 'As per profile'}</span></p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
}
