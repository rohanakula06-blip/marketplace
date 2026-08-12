'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Loader2, UserPlus, Briefcase } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { LoginPortalCards } from '@/components/auth/LoginPortalCards';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useAuthStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { t } = useTranslation();

  useEffect(() => {
    if (!authReady || !user) return;
    if (user.workerProfile || user.role === 'worker' || user.role === 'both') {
      router.replace('/dashboard/worker');
    } else {
      router.replace('/dashboard/customer');
    }
  }, [user, authReady, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-16 mx-auto max-w-lg px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">{t('dashboard.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <LanguageSwitcher variant="footer" />
          <LoginPortalCards />

          <div className="border-t border-slate-100 pt-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 text-center">
              {t('dashboard.newToLocalPro')}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserPlus size={16} className="text-blue-600" />
                {t('dashboard.signUpUser')}
              </Link>
              <Link
                href="/register/worker"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Briefcase size={16} className="text-teal-600" />
                {t('dashboard.joinPro')}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-600">
            {t('dashboard.backHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}
