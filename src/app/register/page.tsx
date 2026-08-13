'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle } from 'lucide-react';
import { TeakAuthShell } from '@/components/auth/TeakAuthShell';
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
    <TeakAuthShell showLanguage={false}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teak-600 mb-4 shadow-md shadow-teak-900/15">
          <UserPlus size={28} className="text-teak-50" />
        </div>
        <h1 className="text-2xl font-bold text-teak-950">Create Your Account</h1>
        <p className="text-teak-600 mt-2 text-sm">Password, email code, or mobile OTP</p>
      </div>

      {done ? (
        <div className="text-center py-4 space-y-4">
          <CheckCircle size={48} className="mx-auto text-green-600" />
          <p className="text-teak-800 font-medium">You&apos;re all set!</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/customer')}
            className="w-full rounded-xl bg-teak-600 py-3 text-sm font-semibold text-teak-50 hover:bg-teak-700"
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
              <p className="text-center text-sm text-teak-700 pt-2">
                Already a user?{' '}
                <Link href="/login" className="text-teak-800 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-xs text-teak-600">
                Want to offer services?{' '}
                <Link href="/register/worker" className="text-teak-800 font-semibold hover:underline">
                  Register as a professional
                </Link>
              </p>
            </>
          }
        />
      )}
    </TeakAuthShell>
  );
}
