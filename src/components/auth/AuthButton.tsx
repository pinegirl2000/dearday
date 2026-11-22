'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';

/**
 * 로그아웃 — 세션 쿠키 삭제 + 이 브라우저에 남아 있던 카드 소유자 토큰(localStorage)도 함께 제거.
 * 소유자 토큰이 남아 있으면 로그아웃 후에도 /cards/[slug]/manage 등에 접근 가능했음.
 * 마지막에 전체 새로고침으로 서버 세션 기준 화면을 다시 그린다.
 */
async function handleSignOut() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('dearday:owner:') || k.startsWith('dd_owner_'))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* storage 접근 불가 환경 — 무시 */ }
  await signOut({ redirect: false });
  // 클라이언트 라우터 캐시에 남은 로그인 상태 화면을 버리고 서버 세션으로 다시 렌더
  window.location.assign('/');
}

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-hydrangea-100 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {/* 이름/아바타 클릭 → 내 카드 보기 */}
        <Link
          href="/cards"
          className="flex items-center gap-2 h-10 rounded-full pr-1 sm:pr-2 hover:bg-hydrangea-50 active:scale-95 transition"
          title="My cards"
        >
          <div className="w-8 h-8 rounded-full bg-hydrangea-100 flex items-center justify-center text-hydrangea-700 text-xs font-semibold">
            {session.user.name?.trim()?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          {/* 🔧 lg 미만에선 아바타만 — 이름까지 넣으면 md(768px) 데스크톱 메뉴와 공간이 겹침 */}
          <span className="hidden lg:inline text-xs text-hydrangea-700 max-w-[120px] truncate">
            {session.user.name}
          </span>
          {/* 스크린리더용 목적지 안내 — aria-label 로 덮으면 화면에 보이는 이름과 접근성 이름이 달라짐(WCAG 2.5.3) */}
          <span className="sr-only">My cards</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-hydrangea-500 hover:bg-hydrangea-50 hover:text-hydrangea-700 transition-colors"
          title="로그아웃"
          aria-label="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-xs font-medium bg-white border border-hydrangea-200 text-hydrangea-700 shadow-sm hover:bg-hydrangea-50 transition-colors"
    >
      <LogIn className="w-3.5 h-3.5" />
      Google 로그인
    </button>
  );
}
