export const LOCALES = ['en', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const COOKIE_NAME = 'dearday-locale';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ko: '한국어'
};
