import api from '../lib/axios.js';

/**
 * Client for the manager-onboarding + dashboard endpoints.
 * `register` takes a FormData (multipart) so it can carry document uploads.
 */
export const managerApi = {
  register: (formData) =>
    api.post('/managers/register', formData).then((r) => r.data),
  verifyEmail: (token) =>
    api.post('/managers/verify-email', { token }).then((r) => r.data),
  me: () => api.get('/managers/me').then((r) => r.data),
  myListings: () => api.get('/managers/me/listings').then((r) => r.data),
  myBookings: () => api.get('/managers/me/bookings').then((r) => r.data),
};
