import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-400', className)} aria-hidden />;
}

/* Full-viewport loader used as a Suspense fallback for route chunks. */
export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-slate-500">{label}…</p>
    </div>
  );
}
