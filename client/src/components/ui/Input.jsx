import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn.js';

/* Labelled text input with icon slot, error state and accessible wiring. */
export const Input = forwardRef(function Input(
  { label, error, icon: Icon, hint, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'input-base',
            Icon && 'pl-10',
            error && 'border-red-500/70 focus:border-red-500',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className, id, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn('input-base resize-none', error && 'border-red-500/70', className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, options = [], className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn('input-base cursor-pointer', error && 'border-red-500/70', className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-ink-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
});
