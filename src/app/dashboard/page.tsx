'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Loader2, UserPlus, Briefcase } from 'lucide-react';
import { SignInShell } from '@/components/auth/SignInShell';
import { LoginPortalCards } from '@/components/auth/LoginPortalCards';
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
      <div className="min-h-screen bg-[#060912] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    );
  }

  if (user) return null;

  return (
    <SignInShell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/25">
          <LayoutDashboard size={28} className="text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">{t('dashboard.subtitle')}</p>
      </div>

      <LoginPortalCards dark />

      <div className="border-t border-white/10 pt-5 mt-6 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 text-center">
          {t('dashboard.newToLocalPro')}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10"
          >
            <UserPlus size={16} className="text-amber-400" />
            {t('dashboard.signUpUser')}
          </Link>
          <Link
            href="/register/worker"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10"
          >
            <Briefcase size={16} className="text-teal-400" />
            {t('dashboard.joinPro')}
          </Link>
        </div>
      </div>

      <p className="text-center mt-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-amber-400">
          {t('dashboard.backHome')}
        </Link>
      </p>
    </SignInShell>
  );
}
