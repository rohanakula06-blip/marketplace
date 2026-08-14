'use client';

import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';
import { REPORT_REASONS } from '@/lib/booking-utils';
import { cn } from '@/lib/utils';

export function ReportModal() {
  const { reportModal, setReportModal, showToast } = useUIStore();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!reportModal) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      showToast('Select a reason for your report', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.reports.create({
        bookingId: reportModal.bookingId,
        workerId: reportModal.workerId,
        reason,
        details: details.trim() || undefined,
      });
      showToast(`Report submitted. We will review ${reportModal.workerName}'s conduct.`, 'success');
      setReportModal(null);
      setReason('');
      setDetails('');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl">
        <button
          type="button"
          onClick={() => setReportModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Report professional</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Report <span className="text-slate-200 font-medium">{reportModal.workerName}</span> for booking{' '}
          <span className="text-slate-200 capitalize">{reportModal.service}</span>. Our team will review your report.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">Reason</label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    reason === r.id
                      ? 'border-red-400/50 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="text-red-500 focus:ring-red-500/30"
                  />
                  <span className="text-sm text-slate-200">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">
              Additional details <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Describe what happened…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 min-h-[90px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !reason}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white py-3 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit report
          </button>
        </form>
      </div>
    </div>
  );
}
