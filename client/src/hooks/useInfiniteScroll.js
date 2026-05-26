import { useEffect, useRef } from 'react';

/**
 * Returns a ref to attach to a sentinel element. When the sentinel scrolls
 * into view `onLoadMore` fires — provided `hasMore` is true and not `loading`.
 */
export function useInfiniteScroll({ hasMore, loading, onLoadMore }) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current();
      },
      { rootMargin: '320px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return sentinelRef;
}
