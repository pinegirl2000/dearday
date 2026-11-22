'use client';

import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className={cn(
          // 🔧 90dvh — 모바일 주소창 높이 변화에도 잘리지 않게 / 데스크톱에선 화면 전체 폭으로 퍼지지 않도록 앱 폭(480px)에 맞춰 가운데 정렬
          'bg-white rounded-t-3xl fixed bottom-0 inset-x-0 mx-auto w-full md:max-w-[480px] max-h-[90dvh] z-50',
          'flex flex-col outline-none'
        )}>
          <div aria-hidden className="mx-auto w-12 h-1.5 rounded-full bg-hydrangea-200 mt-3 mb-2" />
          {title && (
            <div className="px-6 pt-2 pb-3">
              <Drawer.Title className="text-lg font-semibold text-hydrangea-700">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="text-sm text-hydrangea-400 mt-1">{description}</Drawer.Description>
              )}
            </div>
          )}
          <div className="px-6 pt-2 overflow-y-auto no-scrollbar flex-1" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
