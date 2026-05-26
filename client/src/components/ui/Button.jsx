import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const variants = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-ink-700 text-white border border-white/[0.07] hover:bg-ink-600 hover:border-brand-500/40',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  outline:
    'border border-brand-500/50 text-brand-200 hover:bg-brand-500/10 hover:border-brand-400',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
};

const sizes = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5 py-3.5',
};

/* The single button primitive used everywhere — variants, sizes, loading. */
const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    fullWidth = false,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold',
        'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:ring-2 focus-visible:ring-brand-400/70',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden />
      )}
      {children}
      {!loading && IconRight && <IconRight className="h-4 w-4" aria-hidden />}
    </Tag>
  );
});

export default Button;
