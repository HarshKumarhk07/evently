import api from '../lib/axios.js';

export const reviewsApi = {
  list: (itemId) => api.get('/reviews', { params: { itemId } }).then((r) => r.data),
  create: (payload) => api.post('/reviews', payload).then((r) => r.data),
  remove: (id) => api.delete(`/reviews/${id}`),
};
