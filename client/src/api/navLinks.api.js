import api from '../lib/axios.js';

/**
 * Admin-managed navbar entries. Read by the Navbar/MobileHeader at boot;
 * managed via the admin Categories page.
 */
export const navLinksApi = {
  list: () => api.get('/nav-links').then((r) => r.data),
  lookup: (slug) =>
    api.get('/nav-links/lookup', { params: { slug } }).then((r) => r.data),
  create: (payload) => api.post('/admin/nav-links', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/admin/nav-links/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/admin/nav-links/${id}`),
};
