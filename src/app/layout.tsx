import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Noto_Serif_KR, Noto_Sans_KR, Playfair_Display, Great_Vibes, Cormorant_Garamond, Sacramento } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { Toaster } from 'sonner';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/auth/SessionProvider';
import TopBar from '@/components/layout/TopBar';
import InAppBrowserBanner from '@/components/layout/InAppBrowserBanner';
import './globals.css';

const ADSENSE_CLIENT = 'ca-pub-1846879536072566';

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap'
});

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap'
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap'
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap'
});

const sacramento = Sacramento({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap'
});

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
  maximumScale: 1,
  themeColor: '#7B5EA7',
  viewportFit: 'cover'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} className={`${notoSerif.variable} ${notoSans.variable} ${cormorant.variable}`}>
      <head>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans bg-hydrangea-50">
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <InAppBrowserBanner />
            <TopBar />
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
