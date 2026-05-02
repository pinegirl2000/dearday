'use client';

import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';

export default function LoginPrompt() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-hydrangea-500 mb-4">로그인하면 발행한 카드를 볼 수 있습니다.</p>
      <button
        onClick={() => signIn('google', { callbackUrl: '/cards' })}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-hydrangea-500 text-white text-sm font-medium"
      >
        <LogIn className="w-4 h-4" />
        Google로 로그인
      </button>
    </div>
  );
}
