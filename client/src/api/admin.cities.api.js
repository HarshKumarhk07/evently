import api from '../lib/axios.js';

export const createCity = async (payload) => api.post('/admin/cities', payload);
export const updateCity = async (id, payload) => api.patch(`/admin/cities/${id}`, payload);
export const deleteCity = async (id) => api.delete(`/admin/cities/${id}`);
