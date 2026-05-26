import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/* Files are held in memory then streamed to Cloudinary — no disk writes. */
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(ApiError.badRequest('Only image files are allowed'));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
