'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALES, COOKIE_NAME, type Locale } from '@/i18n/config';

export async function setLocaleAction(locale: Locale) {
  if (!LOCALES.includes(locale)) return { ok: false };
  cookies().set(COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  });
  revalidatePath('/', 'layout');
  return { ok: true };
}
