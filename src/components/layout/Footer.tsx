'use client';

import Link from 'next/link';
import { useUIStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function Footer() {
  const { setInfoModal } = useUIStore();
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/10 bg-[#060912] section-padding">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 font-bold text-white">LP</div>
              <span className="text-xl font-bold text-white">LocalPro</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{t('footer.tagline')}</p>
            <p className="mt-4 text-xs text-amber-400/80 font-medium">🏆 AI Hackathon Project — Prototype Demo</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/find-workers" className="hover:text-white">{t('nav.findWorkers')}</a></li>
              <li><a href="/find-jobs" className="hover:text-white">{t('nav.findJobs')}</a></li>
              <li><a href="/register/worker" className="hover:text-white">{t('footer.becomeWorker')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><button type="button" onClick={() => setInfoModal('safety')} className="hover:text-white">{t('footer.safety')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('help')} className="hover:text-white">{t('footer.helpCentre')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('contact')} className="hover:text-white">{t('nav.contact')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('privacy')} className="hover:text-white">{t('footer.privacy')}</button></li>
              <li><button type="button" onClick={() => setInfoModal('terms')} className="hover:text-white">{t('footer.terms')}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('common.language')}</h4>
            <LanguageSwitcher variant="footer" className="mb-6" />
            <p className="text-sm text-slate-500">Team: LocalPro Hackathon Squad</p>
            <p className="text-sm text-slate-500 mt-1">GitHub: github.com/localpro-demo</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-500">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
