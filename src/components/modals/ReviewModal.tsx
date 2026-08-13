'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Star } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ReviewModal() {
  const { reviewModal, setReviewModal, showToast } = useUIStore();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  if (!reviewModal) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      showToast('Select a star rating', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.reviews.create({
        bookingId: reviewModal.bookingId,
        workerId: reviewModal.workerId,
        rating,
        review: review.trim() || 'Great service!',
      });
      showToast(`Thanks for rating ${reviewModal.workerName}!`, 'success');
      setReviewModal(null);
      setRating(5);
      setReview('');
      router.refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
        <button
          type="button"
          onClick={() => setReviewModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Rate {reviewModal.workerName}</h2>
        <p className="text-sm text-slate-500 mb-6">How was the service?</p>

        <form onSubmit={submit} className="space-y-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={cn(
                    n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                  )}
                />
              </button>
            ))}
          </div>

          <textarea
            placeholder="Share your experience (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full input-light rounded-xl px-4 py-3 text-sm min-h-[90px]"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit Rating
          </button>
        </form>
      </div>
    </div>
  );
}
