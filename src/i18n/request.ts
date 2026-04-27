import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALES, DEFAULT_LOCALE, COOKIE_NAME, type Locale } from './config';

function detectLocale(): Locale {
  // 1. cookie
  const cookieLocale = cookies().get(COOKIE_NAME)?.value as Locale | undefined;
  if (cookieLocale && LOCALES.includes(cookieLocale)) return cookieLocale;

  // 2. Accept-Language header
  const accept = headers().get('accept-language') || '';
  for (const part of accept.split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase();
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
