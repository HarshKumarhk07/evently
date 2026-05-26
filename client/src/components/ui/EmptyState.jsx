import { SearchX } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../lib/cn.js';

/* Friendly placeholder for empty lists and zero-result searches. */
export default function EmptyState({
  icon: Icon = SearchX,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-600 bg-ink-800/40 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-300">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action && (
        <Button className="mt-5" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
