import api from '../lib/axios.js';

export const usersApi = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data),
  updateAvatar: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  favorites: () => api.get('/users/me/favorites').then((r) => r.data),
  toggleFavorite: (refType, refId) =>
    api.post('/users/me/favorites', { refType, refId }).then((r) => r.data),
  recentlyViewed: () => api.get('/users/me/recently-viewed').then((r) => r.data),
};
