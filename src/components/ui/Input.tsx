import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, id, ...rest }, ref) => {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-hydrangea-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'w-full min-h-[48px] px-4 rounded-xl border bg-white text-hydrangea-700 placeholder:text-hydrangea-300 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-hydrangea-300 focus:border-transparent',
          error ? 'border-red-300 focus:ring-red-300' : 'border-hydrangea-100',
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-hydrangea-400 mt-1">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, id, ...rest }, ref) => {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-hydrangea-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={4}
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-white text-hydrangea-700 placeholder:text-hydrangea-300 transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-hydrangea-300 focus:border-transparent',
          error ? 'border-red-300 focus:ring-red-300' : 'border-hydrangea-100',
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';
