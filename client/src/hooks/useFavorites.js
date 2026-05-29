import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { usersApi } from '../api/users.api.js';

/**
 * Wishlist helper backed by the authenticated user's `favorites` array.
 * Exposes a fast `isFavorite` check and an optimistic `toggle`.
 */
export function useFavorites() {
  const { user, isAuthenticated, patchUser } = useAuth();
  const [pending, setPending] = useState(null);

  const isFavorite = useCallback(
    (refType, refId) =>
      Boolean(user?.favorites?.some((f) => f.refType === refType && f.refId === refId)),
    [user],
  );

  const toggle = useCallback(
    async (refType, refId) => {
      if (!isAuthenticated) {
        toast.error('Log in to save favorites');
        return;
      }
      setPending(refId);
      try {
        const { favorites } = await usersApi.toggleFavorite(refType, refId);
        patchUser({ favorites });
      } catch (err) {
        toast.error(err.message || 'Could not update favorites');
      } finally {
        setPending(null);
      }
    },
    [isAuthenticated, patchUser],
  );

  const count = user?.favorites?.length || 0;

  return { isFavorite, toggle, pending, count };
}
