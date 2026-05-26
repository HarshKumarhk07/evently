import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Reusable, accessible modal rendered into a portal.
 * Locks body scroll, closes on Escape and on backdrop click.
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative w-full glass rounded-t-3xl sm:rounded-3xl',
              'max-h-[90vh] overflow-hidden flex flex-col',
              sizes[size],
            )}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="border-t border-white/[0.06] px-6 py-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
