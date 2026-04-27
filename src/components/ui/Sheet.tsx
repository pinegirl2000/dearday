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
          'bg-white rounded-t-3xl fixed bottom-0 left-0 right-0 max-h-[90vh] z-50',
          'flex flex-col outline-none'
        )}>
          <div className="mx-auto w-12 h-1.5 rounded-full bg-hydrangea-100 mt-3 mb-2" />
          {title && (
            <div className="px-6 pt-2 pb-3">
              <Drawer.Title className="text-lg font-semibold text-hydrangea-700">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="text-sm text-hydrangea-400 mt-1">{description}</Drawer.Description>
              )}
            </div>
          )}
          <div className="px-6 pb-8 pt-2 overflow-y-auto no-scrollbar flex-1">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
