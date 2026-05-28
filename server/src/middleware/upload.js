import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/* Files are held in memory then streamed to Cloudinary — no disk writes. */
const storage = multer.memoryStorage();

/* Images-only — used by avatar / single listing-cover uploads. */
function imageOnlyFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(ApiError.badRequest('Only image files are allowed'));
}

/* Images OR PDF — needed for manager document uploads (licenses, ID proofs). */
function imageOrPdfFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    return cb(null, true);
  }
  return cb(ApiError.badRequest('Only images or PDF files are allowed'));
}

export const upload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* Manager registration: license + ID proof (single each) + up to 6 business
   images. Files reach the controller on `req.files` keyed by fieldname. */
export const managerDocsUpload = multer({
  storage,
  fileFilter: imageOrPdfFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
}).fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'businessImages', maxCount: 6 },
]);
