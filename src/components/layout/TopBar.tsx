'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Pencil, Settings } from 'lucide-react';
import AuthButton from '@/components/auth/AuthButton';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { isAdminEmail } from '@/lib/admin';

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);
  // 초대장 카드 화면에서는 네비바 숨김
  if (pathname?.startsWith('/i/')) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-3 py-2 gap-2 bg-white/80 backdrop-blur-sm border-b border-hydrangea-100/50">
        <Link
          href="/"
          className="flex items-center gap-2 px-1"
        >
          <span className="dearday-logo" aria-hidden="true">
            <span className="dearday-logo-half dearday-logo-left">
              <svg viewBox="0 0 16 24" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                <path d="M 3 3 L 7 3 Q 14 3 14 12 Q 14 21 7 21 L 3 21 Z M 6 6 L 8 6 Q 11 6 11 12 Q 11 18 8 18 L 6 18 Z" fill="#FFFFFF" fillRule="evenodd" />
              </svg>
            </span>
            <span className="dearday-logo-half dearday-logo-right">
              <svg viewBox="0 0 16 24" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                <path d="M 3 3 L 7 3 Q 14 3 14 12 Q 14 21 7 21 L 3 21 Z M 6 6 L 8 6 Q 11 6 11 12 Q 11 18 8 18 L 6 18 Z" fill="#FFFFFF" fillRule="evenodd" />
              </svg>
            </span>
            <Pencil className="dearday-logo-pencil" strokeWidth={1.6} />
          </span>
          <span className="font-serif text-base font-semibold text-hydrangea-700 tracking-wide">DearDay</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/cards"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-hydrangea-700 hover:bg-hydrangea-50 active:scale-90 transition"
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
      {/* 페이지 컨텐츠 위쪽 여백 — TopBar 노출 시에만 */}
      <div className="h-12" />
    </>
  );
}
