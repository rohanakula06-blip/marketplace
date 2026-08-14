'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

export function Footer() {
  const { setInfoModal } = useUIStore();
  const { t } = useTranslation();
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <footer
      className={cn(
        'border-t section-padding',
        isLanding ? 'border-teak-200 bg-teak-100' : 'border-white/10 bg-[#060912]'
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white',
                  isLanding ? 'bg-teak-600' : 'bg-gradient-to-br from-blue-600 to-teal-500'
                )}
              >
                LP
              </div>
              <span className={cn('text-xl font-bold', isLanding ? 'text-teak-900' : 'text-white')}>
                LocalPro
              </span>
            </div>
            <p className={cn('text-sm leading-relaxed', isLanding ? 'text-teak-700' : 'text-slate-400')}>
              {t('footer.tagline')}
            </p>
            <p className={cn('mt-4 text-xs font-medium', isLanding ? 'text-teak-600' : 'text-amber-400/80')}>
              🏆 AI Hackathon Project — Prototype Demo
            </p>
          </div>
          <div>
            <h4 className={cn('font-semibold mb-4', isLanding ? 'text-teak-900' : 'text-white')}>
              {t('footer.platform')}
            </h4>
            <ul className={cn('space-y-2 text-sm', isLanding ? 'text-teak-700' : 'text-slate-400')}>
              <li><a href="/find-workers" className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('nav.findWorkers')}</a></li>
              <li><a href="/find-jobs" className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('nav.findJobs')}</a></li>
              <li><a href="/register/worker" className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('footer.becomeWorker')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className={cn('font-semibold mb-4', isLanding ? 'text-teak-900' : 'text-white')}>
              {t('footer.support')}
            </h4>
            <ul className={cn('space-y-2 text-sm', isLanding ? 'text-teak-700' : 'text-slate-400')}>
              <li><button type="button" onClick={() => setInfoModal('safety')} className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('footer.safety')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('help')} className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('footer.helpCentre')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('contact')} className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('nav.contact')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('privacy')} className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('footer.privacy')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('terms')} className={isLanding ? 'hover:text-teak-900' : 'hover:text-white'}>{t('footer.terms')}</button></li>
            </ul>
          </div>
          <div>
            <h4 className={cn('font-semibold mb-4', isLanding ? 'text-teak-900' : 'text-white')}>
              {t('common.language')}
            </h4>
            <LanguageSwitcher variant="footer" className="mb-6" />
            <p className={cn('text-sm', isLanding ? 'text-teak-600' : 'text-slate-500')}>Team: LocalPro Hackathon Squad</p>
            <p className={cn('text-sm mt-1', isLanding ? 'text-teak-600' : 'text-slate-500')}>GitHub: github.com/localpro-demo</p>
          </div>
        </div>
        <div
          className={cn(
            'mt-12 pt-8 border-t text-center text-sm',
            isLanding ? 'border-teak-200 text-teak-600' : 'border-white/10 text-slate-500'
          )}
        >
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
