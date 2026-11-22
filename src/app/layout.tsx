import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { FONT_VARIABLE_CLASSNAMES } from '@/lib/fonts';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { Toaster } from 'sonner';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/auth/SessionProvider';
import TopBar from '@/components/layout/TopBar';
import './globals.css';

const ADSENSE_CLIENT = 'ca-pub-1846879536072566';

export const metadata: Metadata = {
  metadataBase: new URL('https://dearday.sg'),
  title: 'DearDay — Invite the dearest day',
  description: 'Beautiful digital invitations for weddings, birthdays, baptisms & gatherings. Real-time RSVP, mobile-first, made for Singapore.',
  openGraph: {
    title: 'DearDay — Invite the dearest day',
    description: 'Beautiful digital invitations for weddings, birthdays, baptisms & gatherings.',
    url: 'https://dearday.sg',
    siteName: 'DearDay',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DearDay — Invite the dearest day',
    description: 'Beautiful digital invitations for your most precious moments.',
    images: ['/api/og']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 🔧 maximumScale 제한 제거 — 저시력 사용자의 핀치 확대를 막지 않기 위함. 입력 포커스 시 iOS 자동 확대는 globals.css 의 16px 규칙으로 방지
  themeColor: '#7B5EA7',
  viewportFit: 'cover'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} className={FONT_VARIABLE_CLASSNAMES}>
      <head>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans bg-hydrangea-50 antialiased">
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <TopBar />
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
