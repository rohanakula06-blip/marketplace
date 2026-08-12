'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/store/app-store';
import { translate, isLanguageCode, type LanguageCode } from '@/lib/i18n';

export function useTranslation() {
  const languageRaw = useUIStore((s) => s.language);
  const language: LanguageCode = isLanguageCode(languageRaw) ? languageRaw : 'en';

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  return { t, language };
}
