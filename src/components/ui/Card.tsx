'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({ children, className, onClick, interactive }: CardProps) {
  const Comp: any = onClick || interactive ? motion.button : 'div';
  return (
    <Comp
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'rounded-2xl bg-white shadow-sm border border-hydrangea-100/50 overflow-hidden text-left w-full',
        onClick && 'active:bg-hydrangea-50/50 transition-colors',
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5 pb-2', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5 pt-2', className)}>{children}</div>;
}
