'use client';

import { cn } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface TeakAuthShellProps {
  children: React.ReactNode;
  wide?: boolean;
  showLanguage?: boolean;
}

/** Light teak auth layout — matches landing page (login / register). */
export function TeakAuthShell({ children, wide = false, showLanguage = true }: TeakAuthShellProps) {
  return (
    <div className="min-h-screen bg-teak-50">
      <Navbar />
      <div className={cn('pt-24 pb-12 mx-auto px-4', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="rounded-2xl landing-card p-6 sm:p-8">
          {showLanguage && <LanguageSwitcher variant="nav" className="mb-6" />}
          {children}
        </div>
      </div>
    </div>
  );
}
