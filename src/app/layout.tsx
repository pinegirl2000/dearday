import type { Metadata, Viewport } from 'next';
import { Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google';
import { Toaster } from 'sonner';
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
  title: 'DearDay — 소중한 날을 초대하다',
  description: '결혼·생일·개업, 모든 소중한 순간을 가장 우아하게 초대하세요'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7B5EA7',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${notoSans.variable}`}>
      <body className="font-sans bg-hydrangea-50">
        {children}
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
