import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

if (env.hasCloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Upload an in-memory file buffer to Cloudinary.
 * Returns null when Cloudinary is not configured so callers can degrade gracefully.
 */
export function uploadBuffer(buffer, folder = 'bookify') {
  if (!env.hasCloudinary) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export function deleteImage(publicId) {
  if (!env.hasCloudinary || !publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
