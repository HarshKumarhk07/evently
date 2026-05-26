import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { uploadBuffer } from '../config/cloudinary.js';

/* POST /api/uploads — admin image upload, returns a hosted URL. */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided');
  const result = await uploadBuffer(req.file.buffer, 'bookify/listings');
  if (!result) throw ApiError.badRequest('Image hosting is not configured on this server');
  return ok(res, { url: result.secure_url, publicId: result.public_id }, 'Image uploaded');
});
