'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { AuthSceneFallback } from './AuthScene';

const AuthScene = dynamic(() => import('./AuthScene').then((m) => m.AuthScene), {
  ssr: false,
  loading: () => <AuthSceneFallback />,
});

interface AuthPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ok = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      setWebglOk(ok);
    } catch {
      setWebglOk(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060912]">
      {webglOk ? <AuthScene /> : <AuthSceneFallback />}

      <Navbar />

      <div className={cn('relative z-10 pt-24 pb-12 mx-auto max-w-md px-4', className)}>
        <div className="rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <LanguageSwitcher variant="nav" className="mb-6" />
          {children}
        </div>
      </div>
    </div>
  );
}
