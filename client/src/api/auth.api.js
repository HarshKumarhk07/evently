import api from '../lib/axios.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};
