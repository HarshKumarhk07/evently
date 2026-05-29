import api from '../lib/axios.js';

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  bookings: (params = {}) => api.get('/admin/bookings', { params }).then((r) => r.data),
  updateBooking: (id, status) =>
    api.patch(`/admin/bookings/${id}`, { status }).then((r) => r.data),

  /* Manager approval queue */
  managers: (params = {}) => api.get('/admin/managers', { params }).then((r) => r.data),
  getManager: (id) => api.get(`/admin/managers/${id}`).then((r) => r.data),
  createManager: (payload) => api.post('/admin/managers', payload).then((r) => r.data),
  approveManager: (id) => api.post(`/admin/managers/${id}/approve`).then((r) => r.data),
  rejectManager: (id, reason) =>
    api.post(`/admin/managers/${id}/reject`, { reason }).then((r) => r.data),
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/admin/uploads', fd).then((r) => r.data);
  },
};
