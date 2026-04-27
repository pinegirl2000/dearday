'use client';

import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  transparent?: boolean;
}

export function MobileHeader({ title, back, right, transparent }: MobileHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (typeof back === 'function') back();
    else router.back();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full',
        transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md border-b border-hydrangea-100/50'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 px-2 flex items-center justify-between">
        <div className="w-12 flex items-center">
          {back && (
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-full flex items-center justify-center active:bg-hydrangea-50 transition-colors"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-6 h-6 text-hydrangea-700" />
            </button>
          )}
        </div>
        {title && <h1 className="font-semibold text-hydrangea-700 text-base">{title}</h1>}
        <div className="w-12 flex items-center justify-end">{right}</div>
      </div>
    </header>
  );
}
