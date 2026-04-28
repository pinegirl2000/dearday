'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut } from 'lucide-react';

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
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-xs text-hydrangea-700 max-w-[100px] truncate">
          {session.user.name}
        </span>
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
