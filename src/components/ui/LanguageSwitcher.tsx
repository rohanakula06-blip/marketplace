'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES } from '@/lib/constants';
import { useUIStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/useTranslation';
import { translate, isLanguageCode, type LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'footer' | 'nav';
  /** Nav bar context for contrast */
  navTheme?: 'dark' | 'light' | 'teak';
}

export function LanguageSwitcher({ className, variant = 'footer', navTheme = 'dark' }: LanguageSwitcherProps) {
  const languageRaw = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const showToast = useUIStore((s) => s.showToast);
  const { t } = useTranslation();
  const active = isLanguageCode(languageRaw) ? languageRaw : 'en';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    showToast(translate(code, 'common.languageChanged'), 'success');
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  if (variant === 'nav') {
    const triggerClass = cn(
      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all border whitespace-nowrap shrink-0',
      navTheme === 'teak'
        ? 'border-teak-300 bg-white text-teak-900 hover:bg-teak-50'
        : navTheme === 'dark'
          ? 'border-white/25 bg-slate-800 text-white hover:bg-slate-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
    );

    const menuClass = cn(
      'absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[160px] rounded-xl border py-1.5 shadow-2xl',
      navTheme === 'teak'
        ? 'border-teak-200 bg-white'
        : 'border-white/15 bg-slate-900'
    );

    return (
      <div ref={ref} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={triggerClass}
        >
          <Globe size={15} className="shrink-0 opacity-90" />
          <span className="max-w-[88px] truncate">{current.label}</span>
          <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className={menuClass} role="listbox">
            {LANGUAGES.map((l) => {
              const selected = active === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(l.code as LanguageCode)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors',
                    navTheme === 'teak'
                      ? selected
                        ? 'bg-teak-600 text-white'
                        : 'text-teak-900 hover:bg-teak-50'
                      : selected
                        ? 'bg-teal-600 text-white'
                        : 'text-white hover:bg-white/10'
                  )}
                >
                  <span className="text-base leading-none">{l.label}</span>
                  {selected && <Check size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-slate-400 mb-2">{t('common.chooseLanguage')}</p>
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
                'px-3 py-2 rounded-lg text-sm font-semibold transition-all border',
                selected
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
