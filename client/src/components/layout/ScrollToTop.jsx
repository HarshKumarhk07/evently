import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* Resets scroll position on every route change. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
