'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-hydrangea-500 text-white shadow-md hover:bg-hydrangea-600',
  secondary: 'bg-white text-hydrangea-700 border border-hydrangea-200',
  ghost: 'bg-transparent text-hydrangea-700 hover:bg-hydrangea-50',
  outline: 'border border-hydrangea-300 text-hydrangea-700 hover:bg-hydrangea-50'
};

const sizeStyles: Record<Size, string> = {
  sm: 'min-h-[40px] px-4 text-sm',
  md: 'min-h-[48px] px-6 text-base',
  lg: 'min-h-[56px] px-8 text-base font-medium'
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(({ variant = 'primary', size = 'md', full, className, ...rest }, ref) => (
  <motion.button
    ref={ref}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={cn(
      'inline-flex items-center justify-center rounded-full font-medium transition-colors active:opacity-90 disabled:opacity-40 disabled:pointer-events-none',
      variantStyles[variant],
      sizeStyles[size],
      full && 'w-full',
      className
    )}
    {...rest}
  />
));
Button.displayName = 'Button';
