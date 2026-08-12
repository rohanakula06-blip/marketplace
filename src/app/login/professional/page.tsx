'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';

export default function ProfessionalLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const { showToast, location, locationReady, coords } = useUIStore();

  const redirectProfessional = (user: Record<string, unknown>) => {
    if (user.workerProfile) router.push('/dashboard/worker');
    else router.push('/register/worker');
  };

  const handleSuccess = (user: Record<string, unknown>) => {
    if (user.role !== 'worker' && user.role !== 'both' && !user.workerProfile) {
      showToast('This account is not registered as a professional. Use customer login instead.', 'error');
      return;
    }

    setUser({ ...user, location: null } as unknown as Parameters<typeof setUser>[0]);
    setJourney('worker');
    resetLocationState();
    requestLiveLocation({ quiet: true, force: true });
    showToast(`Welcome back, ${user.name}!`, 'success');
    redirectProfessional(user);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 mb-4">
            <Briefcase size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Professional Login</h1>
          <p className="text-slate-500 mt-2 text-sm">Password, email code, or mobile OTP</p>
        </div>

        <LoginForm
          variant="professional"
          journey="worker"
          onSuccess={handleSuccess}
          footer={
            <>
              <p className="text-center text-sm text-slate-500 pt-2">
                New professional?{' '}
                <Link href="/register/worker" className="text-teal-600 font-medium hover:underline">
                  Register here
                </Link>
              </p>
              <p className="text-center text-xs text-slate-400">
                Looking for a service?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Customer sign in
                </Link>
              </p>
            </>
          }
        />

        {locationReady && (
          <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
            <MapPin size={12} /> Service area: {location.split(',')[0]}
            {coords.lat ? ` (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
