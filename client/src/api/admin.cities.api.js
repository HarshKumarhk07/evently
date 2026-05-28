import api from '../lib/axios.js';

export const createCity = (payload) => api.post('/admin/cities', payload).then((r) => r.data);
export const updateCity = (id, payload) => api.patch(`/admin/cities/${id}`, payload).then((r) => r.data);
export const deleteCity = (id) => api.delete(`/admin/cities/${id}`).then((r) => r.data);
