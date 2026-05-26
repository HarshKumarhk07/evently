import api from '../lib/axios.js';

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  bookings: (params = {}) => api.get('/admin/bookings', { params }).then((r) => r.data),
  updateBooking: (id, status) =>
    api.patch(`/admin/bookings/${id}`, { status }).then((r) => r.data),
};
