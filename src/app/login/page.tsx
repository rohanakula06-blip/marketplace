'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';
import { useTranslation } from '@/hooks/useTranslation';

export default function CustomerLoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const { showToast } = useUIStore();
  const { t } = useTranslation();

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
    <AuthPageShell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/40">
          <LogIn size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('auth.signIn')}</h1>
        <p className="text-slate-200 mt-2 text-sm">{t('auth.signInSubtitle')}</p>
      </div>

      <LoginForm
        variant="customer"
        journey="customer"
        onSuccess={handleSuccess}
        footer={
          <>
            <p className="text-center text-sm text-slate-700 pt-2">
              {t('auth.newHere')}{' '}
              <Link href="/register" className="text-blue-700 font-semibold hover:underline">
                {t('auth.createAccount')}
              </Link>
            </p>
            <p className="text-center text-xs text-slate-600">
              {t('auth.professional')}{' '}
              <Link href="/login/professional" className="text-teal-700 font-semibold hover:underline">
                {t('auth.proSignIn')}
              </Link>
            </p>
          </>
        }
      />
    </AuthPageShell>
  );
}
