'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Pencil, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import AuthButton from '@/components/auth/AuthButton';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { isAdminEmail } from '@/lib/admin';
import InAppBrowserBanner from '@/components/layout/InAppBrowserBanner';

// 🔧 데스크톱(md 이상)에서만 노출하는 주요 이동 링크 — 모바일은 공간이 좁아 홈 화면·푸터 링크로 대체
// 라벨은 i18n 키 — 언어 전환(한국어/English) 시 메뉴도 함께 바뀌도록
const DESKTOP_NAV: Array<{ href: string; labelKey: 'create' | 'myCards' | 'reminders' | 'blog' }> = [
  { href: '/cards/new', labelKey: 'create' },
  { href: '/cards', labelKey: 'myCards' },
  { href: '/reminders', labelKey: 'reminders' },
  { href: '/blog', labelKey: 'blog' }
];

export default function TopBar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);
  const headerRef = useRef<HTMLElement>(null);

  // 🔧 헤더 실제 높이를 --topbar-h 로 공유 — 인앱 브라우저 배너가 붙으면 헤더가 길어지므로,
  //    고정값 대신 측정값을 써야 본문 여백·sticky 헤더가 배너/상단바에 가려지지 않음
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const sync = () => root.style.setProperty('--topbar-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      // 상단바가 사라지는 화면(/i/*)에선 CSS 기본값으로 복귀
      root.style.removeProperty('--topbar-h');
    };
  }, [pathname]);

  // 초대장 카드 화면에서는 네비바 숨김
  if (pathname?.startsWith('/i/')) return null;

  return (
    <>
      {/* 🔧 노치/다이내믹 아일랜드 아래로 내용이 내려오도록 safe-area 상단 여백 확보 */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-b border-hydrangea-100/60"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
       {/* 인앱 브라우저 안내는 상단바 위에 덮지 않고 헤더 안 첫 줄로 쌓음 — 로고·로그인 버튼이 가려지지 않도록 */}
       <InAppBrowserBanner />
       <div className="mx-auto max-w-6xl h-12 flex justify-between items-center px-3 md:px-6 gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-1 py-2 rounded-lg"
          aria-label={t('home')}
        >
          <span className="dearday-logo" aria-hidden="true">
            <span className="dearday-logo-half dearday-logo-left">
              <svg viewBox="0 0 16 24" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                <path d="M 3 3 L 7 3 Q 14 3 14 12 Q 14 21 7 21 L 3 21 Z M 5 5 L 8 5 Q 12 5 12 12 Q 12 19 8 19 L 5 19 Z" fill="#FFFFFF" fillRule="evenodd" />
              </svg>
            </span>
            <span className="dearday-logo-half dearday-logo-right">
              <svg viewBox="0 0 16 24" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                <path d="M 3 3 L 7 3 Q 14 3 14 12 Q 14 21 7 21 L 3 21 Z M 5 5 L 8 5 Q 12 5 12 12 Q 12 19 8 19 L 5 19 Z" fill="#FFFFFF" fillRule="evenodd" />
              </svg>
            </span>
            <Pencil className="dearday-logo-pencil" strokeWidth={2.4} />
          </span>
          <span className="font-serif text-base font-semibold text-hydrangea-700 tracking-wide">DearDay</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 mr-auto ml-6" aria-label={t('main')}>
          {DESKTOP_NAV.map((item) => {
            const active = item.href === '/cards' ? pathname === '/cards' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'px-3 py-2 rounded-full text-sm transition-colors',
                  active ? 'text-hydrangea-700 font-semibold bg-hydrangea-50' : 'text-hydrangea-500 hover:text-hydrangea-700 hover:bg-hydrangea-50'
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5 md:gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-hydrangea-700 hover:bg-hydrangea-50 active:scale-90 transition"
              title="Admin"
              aria-label="Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
          <AuthButton />
          <LocaleSwitcher />
        </div>
       </div>
      </header>
      {/* 페이지 컨텐츠 위쪽 여백 — TopBar 노출 시에만 (배너·safe-area 포함 실측 높이와 동일) */}
      <div aria-hidden style={{ height: 'var(--topbar-h)' }} />
    </>
  );
}
