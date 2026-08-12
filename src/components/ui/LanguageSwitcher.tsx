'use client';

import { LANGUAGES } from '@/lib/constants';
import { useUIStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';
import { translate, isLanguageCode, type LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'footer' | 'nav';
}

export function LanguageSwitcher({ className, variant = 'footer' }: LanguageSwitcherProps) {
  const languageRaw = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const showToast = useUIStore((s) => s.showToast);
  const { t } = useTranslation();
  const active = isLanguageCode(languageRaw) ? languageRaw : 'en';

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    showToast(translate(code, 'common.languageChanged'), 'success');
  };

  return (
    <div className={className}>
      {variant === 'footer' && (
        <p className="text-xs text-slate-400 mb-2">{t('common.chooseLanguage')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => {
          const selected = active === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code as LanguageCode)}
              aria-pressed={selected}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                variant === 'nav'
                  ? selected
                    ? 'bg-amber-400 text-slate-900 border-amber-300'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  : selected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'glass text-slate-700 border-slate-200 hover:bg-slate-100'
              )}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
