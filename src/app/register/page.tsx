'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { RegisterAccountForm } from '@/components/auth/RegisterAccountForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const { showToast } = useUIStore();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.workerProfile) router.replace('/dashboard/worker');
      else router.replace('/dashboard/customer');
    }
  }, [user, router]);

  const handleSuccess = (registered: Record<string, unknown>) => {
    setUser({ ...registered, location: null } as unknown as Parameters<typeof setUser>[0]);
    setJourney('customer');
    resetLocationState();
    requestLiveLocation({ quiet: true, force: true });
    setDone(true);
    showToast('Account created! Welcome to LocalPro.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
          <p className="text-slate-500 mt-2 text-sm">Password, email code, or mobile OTP</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {done ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <p className="text-slate-700 font-medium">You&apos;re all set!</p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/customer')}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to My Dashboard
              </button>
            </div>
          ) : (
            <RegisterAccountForm
              variant="customer"
              journey="customer"
              onSuccess={handleSuccess}
              footer={
                <>
                  <p className="text-center text-sm text-slate-500 pt-2">
                    Already a user?{' '}
                    <Link href="/login" className="text-blue-600 font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-center text-xs text-slate-400">
                    Want to offer services?{' '}
                    <Link href="/register/worker" className="text-teal-600 hover:underline">
                      Register as a professional
                    </Link>
                  </p>
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
