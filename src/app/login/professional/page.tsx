'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore, useUIStore } from '@/store/app-store';
import { requestLiveLocation, resetLocationState } from '@/lib/location-service';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfessionalLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setJourney = useAuthStore((s) => s.setJourney);
  const { showToast } = useUIStore();
  const { t } = useTranslation();

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
    <AuthPageShell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 mb-4 shadow-lg shadow-teal-600/40">
          <Briefcase size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('auth.proLogin')}</h1>
        <p className="text-slate-200 mt-2 text-sm">{t('auth.signInSubtitle')}</p>
      </div>

      <LoginForm
        variant="professional"
        journey="worker"
        onSuccess={handleSuccess}
        footer={
          <>
            <p className="text-center text-sm text-slate-700 pt-2">
              {t('auth.newPro')}{' '}
              <Link href="/register/worker" className="text-teal-700 font-semibold hover:underline">
                {t('auth.registerHere')}
              </Link>
            </p>
            <p className="text-center text-xs text-slate-600">
              {t('auth.lookingForService')}{' '}
              <Link href="/login" className="text-blue-700 font-semibold hover:underline">
                {t('auth.customerSignIn')}
              </Link>
            </p>
          </>
        }
      />
    </AuthPageShell>
  );
}
