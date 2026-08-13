'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Clock, MapPin } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import {
  TIME_SLOTS,
  minBookingDate,
  defaultBookingDate,
  defaultBookingTime,
  validateBookingSchedule,
} from '@/lib/booking-utils';

export function BookingModal() {
  const { bookingModal, selectedWorkerId, setBookingModal, showToast, location } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [worker, setWorker] = useState<{ name: string; category: string; pricing: string; isAvailable?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service: '',
    description: '',
    date: defaultBookingDate(),
    time: defaultBookingTime(),
    address: '',
    urgency: 'normal',
    price: '',
  });

  useEffect(() => {
    if (selectedWorkerId) {
      api.workers.get(selectedWorkerId).then((d) => {
        const w = d.worker as {
          user: { name: string };
          category: string;
          pricing: string;
          isAvailable?: boolean;
        };
        setWorker({
          name: w.user.name,
          category: w.category,
          pricing: w.pricing,
          isAvailable: w.isAvailable,
        });
        setForm((f) => ({
          ...f,
          service: w.category,
          price: w.pricing,
          date: defaultBookingDate(),
          time: defaultBookingTime(),
        }));
      }).catch(() => {});
    }
  }, [selectedWorkerId]);

  if (!bookingModal) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    const scheduleErr = validateBookingSchedule(form.date, form.time);
    if (scheduleErr) {
      showToast(scheduleErr, 'error');
      return;
    }
    if (worker?.isAvailable === false) {
      showToast('This professional is offline. Pick someone who is online.', 'error');
      return;
    }
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
        <button type="button" onClick={() => setBookingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Book Professional</h2>
        <p className="text-sm text-slate-500 mb-6">Choose when you need the service</p>

        {worker && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
              {worker.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{worker.name}</p>
              <p className="text-sm text-slate-500 capitalize">{worker.category} · {worker.pricing}</p>
            </div>
            {worker.isAvailable !== false ? (
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Online</span>
            ) : (
              <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">Offline</span>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <textarea
            placeholder="Describe the problem or work needed"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full input-light rounded-xl px-4 py-3 text-sm min-h-[80px]"
            required
          />
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Service address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full input-light rounded-xl pl-9 pr-4 py-3 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date
              </label>
              <input
                type="date"
                min={minBookingDate()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full input-light rounded-xl px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Clock size={12} /> Time slot
              </label>
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full input-light rounded-xl px-4 py-3 text-sm"
                required
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            className="w-full input-light rounded-xl px-4 py-3 text-sm"
          >
            <option value="normal">Normal — flexible timing</option>
            <option value="same-day">Same day — need help today</option>
            <option value="emergency">Emergency — urgent</option>
          </select>

          {location && (
            <p className="text-xs text-slate-400">Your area: {location.split(',')[0]}</p>
          )}

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
            <p className="text-slate-600">
              Estimated price:{' '}
              <span className="text-amber-700 font-semibold">{form.price || 'As per profile'}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || worker?.isAvailable === false}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Send Booking Request
          </button>
        </form>
      </div>
    </div>
  );
}
