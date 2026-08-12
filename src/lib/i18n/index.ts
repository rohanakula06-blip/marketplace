import { translations, type LanguageCode } from './translations';

function resolveTree(lang: LanguageCode, key: string): string | undefined {
  const parts = key.split('.');
  let node: unknown = translations[lang];

  for (const part of parts) {
    if (!node || typeof node !== 'object' || !(part in node)) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === 'string' ? node : undefined;
}

export function translate(
  lang: LanguageCode,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw = resolveTree(lang, key) ?? resolveTree('en', key) ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (text, [k, v]) => text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    raw
  );
}

export function isLanguageCode(value: string): value is LanguageCode {
  return value === 'en' || value === 'hi' || value === 'te';
}

export { type LanguageCode } from './translations';
