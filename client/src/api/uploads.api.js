import api from '../lib/axios.js';

/* Wraps the admin image-upload endpoint. Returns `{ url, publicId }`
   from Cloudinary on success. */
export const uploadsApi = {
  image: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/admin/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
