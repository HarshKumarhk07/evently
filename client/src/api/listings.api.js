import api from '../lib/axios.js';

/* The three verticals share an identical REST surface, so one factory
   produces a typed client for each collection. */
function listingClient(resource) {
  return {
    list: (params = {}) => api.get(`/${resource}`, { params }).then((r) => r.data),
    get: (idOrSlug) => api.get(`/${resource}/${idOrSlug}`).then((r) => r.data),
    similar: (id) => api.get(`/${resource}/${id}/similar`).then((r) => r.data),
    create: (payload) => api.post(`/${resource}`, payload).then((r) => r.data),
    update: (id, payload) => api.patch(`/${resource}/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`/${resource}/${id}`),
  };
}

export const restaurantsApi = listingClient('restaurants');
export const playsApi = listingClient('plays');
export const eventsApi = listingClient('events');

/* Resolve a vertical key ('dining' | 'plays' | 'events') to its client. */
export const listingApiFor = (vertical) =>
  ({ dining: restaurantsApi, plays: playsApi, events: eventsApi }[vertical]);
