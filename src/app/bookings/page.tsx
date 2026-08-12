'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { MapPin, Clock, Briefcase, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';

interface Booking {
  id: string;
  service: string;
  description: string | null;
  date: string;
  time: string;
  price: string;
  status: string;
  address: string | null;
  customer: { id: string; name: string };
  worker: { id: string; name: string; workerProfile?: { category: string } };
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  arriving: 'bg-indigo-100 text-indigo-800',
  started: 'bg-purple-100 text-purple-800',
  completed: 'bg-teal-100 text-teal-800',
  paid: 'bg-emerald-100 text-emerald-800',
  reviewed: 'bg-slate-100 text-slate-800',
};

export default function BookingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { setMessageModal, setPaymentModal, showToast } = useUIStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [loading, setLoading] = useState(true);

  const loadBookings = async (r: 'customer' | 'worker') => {
    setLoading(true);
    try {
      const data = await api.bookings.list(r);
      setBookings(data.bookings as unknown as Booking[]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push('/login');
      else showToast('Failed to load bookings from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!user) { router.replace('/login'); return; }
    const r = user.workerProfile ? 'worker' : 'customer';
    setRole(r);
    loadBookings(r);
  }, [user, authReady, router]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.bookings.update(id, status);
      setBookings((b) => b.map((x) => x.id === id ? { ...x, status } : x));
      showToast(`Booking ${status}`, 'success');
    } catch {
      showToast('Failed to update booking', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Bookings & Jobs</h1>
            <p className="text-slate-500 mt-1">Live from database · {bookings.length} records</p>
          </div>
          {user.workerProfile && (
            <div className="flex gap-2">
              {(['customer', 'worker'] as const).map((r) => (
                <button key={r} onClick={() => { setRole(r); loadBookings(r); }}
                  className={cn('px-4 py-2 rounded-xl text-sm font-medium capitalize', role === r ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600')}>
                  As {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading from backend...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="font-semibold text-slate-700 mb-2">No bookings yet</h3>
            <Link href={role === 'customer' ? '/find-workers' : '/find-jobs'} className="btn-primary">Find {role === 'customer' ? 'a Worker' : 'Jobs'}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 capitalize">{b.service}</h3>
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium capitalize', STATUS_COLORS[b.status] || 'bg-slate-100')}>{b.status}</span>
                    </div>
                    {b.description && <p className="text-sm text-slate-600 mb-2">{b.description}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={14} />{b.date} at {b.time}</span>
                      {b.address && <span className="flex items-center gap-1"><MapPin size={14} />{b.address}</span>}
                      <span className="flex items-center gap-1"><Briefcase size={14} />{role === 'customer' ? b.worker.name : b.customer.name}</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 mt-2">{b.price}</p>
                  </div>
                  <ChevronRight className="text-slate-300 shrink-0" size={20} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setMessageModal({ userId: role === 'customer' ? b.worker.id : b.customer.id, bookingId: b.id })}
                    className="text-sm px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium">Message</button>
                  {role === 'worker' && b.status === 'requested' && (
                    <button onClick={() => updateStatus(b.id, 'accepted')} className="text-sm px-4 py-2 rounded-xl bg-green-600 text-white font-medium">Accept Booking</button>
                  )}
                  {role === 'customer' && b.status === 'completed' && (
                    <button onClick={() => setPaymentModal(b.id)} className="text-sm px-4 py-2 rounded-xl bg-amber-500 text-white font-medium">Pay Now (Demo)</button>
                  )}
                  {b.status === 'accepted' && (
                    <button onClick={() => updateStatus(b.id, 'confirmed')} className="text-sm px-4 py-2 rounded-xl bg-blue-600 text-white font-medium">Confirm</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
