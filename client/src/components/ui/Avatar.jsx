import { initialsOf } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

/* Image avatar with a graceful initials fallback. */
export default function Avatar({ name = 'User', src, size = 'md', className }) {
  return src ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className={cn('rounded-full object-cover ring-2 ring-white/10', sizes[size], className)}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-gradient font-bold text-white ring-2 ring-white/10',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initialsOf(name)}
    </div>
  );
}
