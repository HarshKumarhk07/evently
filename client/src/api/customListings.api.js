import api from '../lib/axios.js';

/**
 * Listings for fully-custom admin-created categories (NavLinks with no
 * `targetVertical`). Same REST surface as the dining/plays/events APIs so
 * the rest of the app can reuse the existing components.
 */
export const customListingsApi = {
  list: (params = {}) =>
    api.get('/custom-listings', { params }).then((r) => r.data),
  get: (idOrSlug) => api.get(`/custom-listings/${idOrSlug}`).then((r) => r.data),
  create: (payload) => api.post('/custom-listings', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/custom-listings/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/custom-listings/${id}`),
};
