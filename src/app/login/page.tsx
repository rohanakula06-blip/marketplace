'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';

export default function CustomerLoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const { showToast } = useUIStore();

  useEffect(() => {
    if (!authReady || !user) return;
    if (user.workerProfile) router.replace('/dashboard/worker');
    else router.replace('/dashboard/customer');
  }, [user, authReady, router]);

  const handleSuccess = (loggedIn: Record<string, unknown>) => {
    if (loggedIn.role === 'worker' || loggedIn.workerProfile) {
      showToast('This is a professional account. Use professional login.', 'error');
      return;
    }

    setUser({ ...loggedIn, location: null } as unknown as Parameters<typeof setUser>[0]);
    setJourney('customer');
    resetLocationState();
    requestLiveLocation({ quiet: true, force: true });
    showToast(`Welcome back, ${loggedIn.name}!`, 'success');
    router.push('/dashboard/customer');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
          <p className="text-slate-500 mt-2 text-sm">Password, email code, or mobile OTP</p>
        </div>

        <LoginForm
          variant="customer"
          journey="customer"
          onSuccess={handleSuccess}
          footer={
            <>
              <p className="text-center text-sm text-slate-500 pt-2">
                New here?{' '}
                <Link href="/register" className="text-blue-600 font-medium hover:underline">
                  Create an account
                </Link>
              </p>
              <p className="text-center text-xs text-slate-400">
                Professional?{' '}
                <Link href="/login/professional" className="text-teal-600 hover:underline">
                  Pro sign in
                </Link>
              </p>
            </>
          }
        />
      </div>
    </div>
  );
}
