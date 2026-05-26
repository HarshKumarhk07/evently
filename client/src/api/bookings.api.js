import api from '../lib/axios.js';

export const bookingsApi = {
  create: (payload) => api.post('/bookings', payload).then((r) => r.data),
  mine: (params = {}) => api.get('/bookings/me', { params }).then((r) => r.data),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data),
  confirm: (id, verification) =>
    api.post(`/bookings/${id}/confirm`, verification).then((r) => r.data),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`).then((r) => r.data),
};
