'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-hydrangea-100 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {/* 이름/아바타 클릭 → 내 카드 보기 */}
        <Link
          href="/cards"
          className="flex items-center gap-2 rounded-full pr-1 hover:bg-hydrangea-50 active:scale-95 transition"
          title="My cards"
        >
          <div className="w-8 h-8 rounded-full bg-hydrangea-100 flex items-center justify-center text-hydrangea-700 text-xs font-semibold">
            {session.user.name?.trim()?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <span className="text-xs text-hydrangea-700 max-w-[100px] truncate">
            {session.user.name}
          </span>
        </Link>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-hydrangea-500 hover:bg-hydrangea-50"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-hydrangea-200 text-hydrangea-700 shadow-sm hover:bg-hydrangea-50"
    >
      <LogIn className="w-3.5 h-3.5" />
      Google 로그인
    </button>
  );
}
