'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';

export function PaymentModal() {
  const { paymentModal, setPaymentModal, showToast } = useUIStore();
  const router = useRouter();
  const [method, setMethod] = useState('upi');
  const [loading, setLoading] = useState(false);

  if (!paymentModal) return null;

  const { bookingId, price, service } = paymentModal;

  const pay = async () => {
    setLoading(true);
    try {
      await api.payments.create({ bookingId, amount: price, method });
      showToast('Demo payment completed!', 'success');
      setPaymentModal(null);
      router.refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-md p-8 relative">
        <button onClick={() => setPaymentModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={20} /></button>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment</h2>
        <p className="text-xs text-amber-600 mb-6">Demo Payment — No real money will be charged.</p>

        <div className="space-y-3 mb-6">
          {[
            { id: 'upi', icon: Smartphone, label: 'UPI' },
            { id: 'card', icon: CreditCard, label: 'Credit / Debit Card' },
            { id: 'cash', icon: Banknote, label: 'Cash After Service' },
          ].map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-slate-800 ${method === m.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 glass'}`}>
              <m.icon size={20} />{m.label}
            </button>
          ))}
        </div>

        <div className="glass rounded-xl p-4 mb-6 text-sm">
          <div className="flex justify-between mb-2"><span className="text-slate-500">Service</span><span className="text-slate-900 capitalize">{service}</span></div>
          <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span className="text-amber-600">{price}</span></div>
        </div>

        <button onClick={pay} disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />} Pay {price} (Demo)
        </button>
      </div>
    </div>
  );
}
