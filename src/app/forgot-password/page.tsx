'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { showToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-md px-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-slate-500 mt-2 text-sm">We&apos;ll email you a link to reset your password</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center space-y-4">
            <CheckCircle size={40} className="mx-auto text-green-500" />
            <p className="text-slate-700">
              If an account exists for <strong>{email}</strong>, check your inbox for a reset link.
            </p>
            <p className="text-xs text-slate-400">Check spam if you don&apos;t see it within a few minutes.</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send Reset Link
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          Professional?{' '}
          <Link href="/login/professional" className="text-teal-600 font-medium hover:underline">
            Pro login
          </Link>
        </p>
      </div>
    </div>
  );
}
