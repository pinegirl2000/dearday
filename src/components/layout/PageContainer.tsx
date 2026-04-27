import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * 모바일 우선 컨테이너 — 데스크톱에서도 모바일 폭으로 가운데 정렬.
 * safe-area-inset-bottom 자동 대응.
 */
export function PageContainer({ children, className, noPadding }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[480px] min-h-screen bg-white', !noPadding && 'px-5', className)}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {children}
    </div>
  );
}
