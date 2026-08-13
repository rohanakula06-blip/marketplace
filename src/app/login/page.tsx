'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { SignInShell } from '@/components/auth/SignInShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState, bootstrapLocationFromProfile } from '@/lib/location-service';
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
    void bootstrapLocationFromProfile().then(() => requestLiveLocation({ quiet: true, force: false }));
    showToast(`Welcome back, ${loggedIn.name}!`, 'success');
    router.push('/dashboard/customer');
  };

  return (
    <SignInShell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/25">
          <LogIn size={28} className="text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('auth.signIn')}</h1>
        <p className="text-slate-400 mt-2 text-sm">{t('auth.signInSubtitle')}</p>
      </div>

      <LoginForm
        variant="customer"
        journey="customer"
        theme="dark"
        onSuccess={handleSuccess}
        footer={
          <>
            <p className="text-center text-sm text-slate-400 pt-2">
              {t('auth.newHere')}{' '}
              <Link href="/register" className="text-amber-400 font-semibold hover:underline">
                {t('auth.createAccount')}
              </Link>
            </p>
            <p className="text-center text-xs text-slate-500">
              {t('auth.professional')}{' '}
              <Link href="/login/professional" className="text-teal-400 font-semibold hover:underline">
                {t('auth.proSignIn')}
              </Link>
            </p>
          </>
        }
      />
    </SignInShell>
  );
}
