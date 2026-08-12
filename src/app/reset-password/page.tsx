'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { api, ApiError } from '@/lib/api';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const setUser = useAuthStore((s) => s.setUser);
  const { showToast } = useUIStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!token) {
      showToast('Invalid reset link', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.resetPassword(token, password);
      setUser({ ...data.user, location: null } as unknown as Parameters<typeof setUser>[0]);
      resetLocationState();
      requestLiveLocation({ quiet: true, force: true });
      setDone(true);
      showToast('Password updated — you are signed in', 'success');
      setTimeout(() => {
        const role = data.user.role as string;
        const hasProfile = Boolean(data.user.workerProfile);
        if (role === 'worker' || hasProfile) router.push('/dashboard/worker');
        else router.push('/dashboard/customer');
      }, 1500);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center space-y-4">
        <p className="text-slate-700">This reset link is invalid or missing.</p>
        <Link href="/forgot-password" className="text-blue-600 font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center space-y-4">
        <CheckCircle size={40} className="mx-auto text-green-500" />
        <p className="text-slate-700 font-medium">Password updated successfully!</p>
        <p className="text-sm text-slate-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">New password</label>
        <div className="relative mt-1">
          <input
            type={showPass ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Confirm password</label>
        <input
          type={showPass ? 'text' : 'password'}
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Update Password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-slate-500 mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-500 py-8">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
