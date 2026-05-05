import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  requiredMark?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, hint, requiredMark, id, ...rest }, ref) => {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-hydrangea-700 mb-1.5">
          {label}
          {requiredMark && <span className="text-red-500 ml-1">*</span>}
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
  requiredMark?: boolean;
  /** 라벨 옆에 작은 글씨로 표시되는 안내 */
  labelHint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, requiredMark, labelHint, id, ...rest }, ref) => {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-hydrangea-700 mb-1.5">
          {label}
          {requiredMark && <span className="text-red-500 ml-1">*</span>}
          {labelHint && <span className="ml-2 text-[11px] font-normal text-hydrangea-400">{labelHint}</span>}
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
