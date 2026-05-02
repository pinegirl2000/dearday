'use client';

import Link from 'next/link';
import AuthButton from '@/components/auth/AuthButton';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-3 py-2 gap-2 bg-white/80 backdrop-blur-sm border-b border-hydrangea-100/50">
      <Link
        href="/"
        className="font-serif text-base font-semibold text-hydrangea-700 tracking-wide px-1"
      >
        DearDay
      </Link>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <AuthButton />
      </div>
    </div>
  );
}
