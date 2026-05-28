import axios from 'axios';

const TOKEN_KEY = 'bookify_token';
const LEGACY_TOKEN_KEY = 'district_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY),
  set: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },
};

/* Single configured axios instance used by the whole API layer. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

/* Attach the bearer token to every request. */
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  /* When the body is FormData we must let axios + the browser generate the
     `Content-Type: multipart/form-data; boundary=…` header themselves —
     manually setting it (as some callers do) drops the boundary and the
     server fails to parse the multipart body. */
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

/* Normalize responses to their payload and errors to a friendly message. */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'The request timed out' : 'Something went wrong');

    /* An expired/invalid session on a protected call — clear stale token. */
    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
    }

    return Promise.reject({
      status,
      message,
      details: error.response?.data?.details,
    });
  },
);

export default api;
