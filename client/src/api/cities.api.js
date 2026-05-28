import axios from 'axios';

export async function listCities(params = {}) {
  const res = await axios.get('/api/cities', { params });
  return res.data;
}

export async function nearestCity(lat, lng, maxDistance) {
  const res = await axios.get('/api/cities/nearest', { params: { lat, lng, maxDistance } });
  return res.data;
}
