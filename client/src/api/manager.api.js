import api from '../lib/axios.js';

/**
 * Client for the manager-onboarding + dashboard endpoints.
 * `register` takes a FormData (multipart) so it can carry document uploads.
 */
export const managerApi = {
  register: (formData) =>
    api.post('/managers/register', formData).then((r) => r.data),

  /* OTP-code flow (canonical). */
  verifyOtp: (email, otp) =>
    api.post('/managers/verify-otp', { email, otp }).then((r) => r.data),
  resendOtp: (email) =>
    api.post('/managers/resend-otp', { email }).then((r) => r.data),

  /* Legacy token-link path — left in place so any verification emails
     already in flight still work. */
  verifyEmail: (token) =>
    api.post('/managers/verify-email', { token }).then((r) => r.data),

  me: () => api.get('/managers/me').then((r) => r.data),
  uploadMedia: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/managers/me/upload', fd).then((r) => r.data);
  },
  updateMe: (payload) => api.patch('/managers/me', payload).then((r) => r.data),
  myListings: () => api.get('/managers/me/listings').then((r) => r.data),
  myBookings: () => api.get('/managers/me/bookings').then((r) => r.data),
};
