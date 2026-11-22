import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 페이지 폭 프리셋
 * - app: 카드 작성·관리처럼 휴대폰 화면을 그대로 옮긴 작업 화면 — 데스크톱에서도 480px 폭 유지
 * - prose: 블로그·약관 등 읽기 위주 페이지 — 데스크톱에서 한 줄 65~75자 수준으로 넓힘
 * - wide: 홈처럼 탐색 위주 페이지 — 데스크톱에서 그리드를 펼칠 수 있도록 넓힘
 */
type ContainerSize = 'app' | 'prose' | 'wide';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  size?: ContainerSize;
}

const SIZE_STYLES: Record<ContainerSize, string> = {
  // 🔧 데스크톱에서 좁은 흰 기둥이 배경에 묻히지 않도록 옅은 테두리·그림자로 "앱 화면" 영역을 구분
  app: 'max-w-[480px] md:border-x md:border-hydrangea-100/70 md:shadow-[0_0_40px_-12px_rgba(90,61,122,0.18)]',
  prose: 'max-w-[480px] md:max-w-3xl md:px-10',
  wide: 'max-w-[480px] md:max-w-3xl lg:max-w-5xl'
};

/**
 * 모바일 우선 컨테이너 — size 에 따라 데스크톱 폭을 다르게 확장.
 * safe-area-inset-bottom 자동 대응.
 */
export function PageContainer({ children, className, noPadding, size = 'app' }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-h-[calc(100dvh-var(--topbar-h))] bg-white',
        SIZE_STYLES[size],
        !noPadding && 'px-5',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {children}
    </div>
  );
}
