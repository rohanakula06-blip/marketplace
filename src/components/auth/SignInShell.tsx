'use client';

import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface SignInShellProps {
  children: React.ReactNode;
  wide?: boolean;
}

/** Black glass sign-in layout — login pages only. */
export function SignInShell({ children, wide = false }: SignInShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060912]">
      <div className="absolute inset-0 hero-dark-ambient pointer-events-none" />

      <Navbar />

      <div className={cn('relative z-10 pt-24 pb-12 mx-auto px-4', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <LanguageSwitcher variant="nav" className="mb-6" />
          {children}
        </div>
      </div>
    </div>
  );
}
