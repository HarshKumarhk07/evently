import api from '../lib/axios.js';

/**
 * Admin-managed taxonomy used by the listing forms and filter sidebar.
 * `kind` is one of: cuisine, category, genre, feature.
 */
export const categoriesApi = {
  list: (params = {}) => api.get('/categories', { params }).then((r) => r.data),
  create: (payload) => api.post('/admin/categories', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/admin/categories/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/admin/categories/${id}`),
};
