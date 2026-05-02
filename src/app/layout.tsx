import type { Metadata, Viewport } from 'next';
import { Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { Toaster } from 'sonner';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/auth/SessionProvider';
import TopBar from '@/components/layout/TopBar';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'DearDay — Invite the dearest day',
  description: 'Wedding · Birthday · Opening — invite anyone to your most precious moments'
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
    <html lang={locale} className={`${notoSerif.variable} ${notoSans.variable}`}>
      <body className="font-sans bg-hydrangea-50">
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
