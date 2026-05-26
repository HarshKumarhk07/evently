import { useState } from 'react';
import { cn } from '../../lib/cn.js';

/**
 * Lazy-loaded image with a shimmer placeholder and a fade-in on load.
 * Falls back to a gradient block if the source fails.
 */
export default function LazyImage({ src, alt = '', className, imgClassName, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-ink-700', className)}>
      {!loaded && !failed && <div className="skeleton absolute inset-0" />}
      {failed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-600" />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-700',
            loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-lg',
            imgClassName,
          )}
          {...props}
        />
      )}
    </div>
  );
}
